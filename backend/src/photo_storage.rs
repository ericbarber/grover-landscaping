use crate::PhotoUploadMetadata;
use hmac::{Hmac, Mac};
use reqwest::{header::RANGE, StatusCode};
use sha2::{Digest, Sha256};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;
const PHOTO_METADATA_RANGE_BYTES: u64 = 512 * 1024;

#[derive(Clone, Debug)]
pub enum PhotoStorageConfig {
    Local,
    S3(S3PhotoStorageConfig),
}

#[derive(Clone, Debug)]
pub struct S3PhotoStorageConfig {
    pub bucket: String,
    pub region: String,
    pub access_key_id: String,
    pub secret_access_key: String,
    pub session_token: Option<String>,
    pub key_prefix: String,
    pub upload_expires_seconds: u32,
    pub display_expires_seconds: u32,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PhotoStorageTicket {
    pub upload_mode: &'static str,
    pub upload_url: String,
    pub object_key: String,
    pub thumbnail_upload_url: Option<String>,
    pub thumbnail_object_key: Option<String>,
}

impl PhotoStorageConfig {
    pub fn from_env() -> Self {
        Self::try_from_env().unwrap_or(Self::Local)
    }

    pub fn try_from_env() -> Result<Self, String> {
        match std::env::var("PHOTO_STORAGE_MODE") {
            Ok(mode) if mode.eq_ignore_ascii_case("s3") => {
                let bucket = required_env("S3_PHOTO_BUCKET")?;
                let region = std::env::var("S3_PHOTO_REGION")
                    .or_else(|_| std::env::var("AWS_REGION"))
                    .unwrap_or_else(|_| "us-east-1".to_string());
                let access_key_id = required_env("AWS_ACCESS_KEY_ID")?;
                let secret_access_key = required_env("AWS_SECRET_ACCESS_KEY")?;
                let session_token = std::env::var("AWS_SESSION_TOKEN")
                    .ok()
                    .filter(|token| !token.trim().is_empty());
                let key_prefix =
                    std::env::var("S3_PHOTO_KEY_PREFIX").unwrap_or_else(|_| "photos".to_string());
                let upload_expires_seconds =
                    env_u32("S3_PHOTO_UPLOAD_EXPIRES_SECONDS").unwrap_or(900);
                let display_expires_seconds =
                    env_u32("S3_PHOTO_DISPLAY_EXPIRES_SECONDS").unwrap_or(900);

                Ok(Self::S3(S3PhotoStorageConfig {
                    bucket,
                    region,
                    access_key_id,
                    secret_access_key,
                    session_token,
                    key_prefix,
                    upload_expires_seconds,
                    display_expires_seconds,
                }))
            }
            Ok(mode) if mode.eq_ignore_ascii_case("local") => Ok(Self::Local),
            Ok(mode) if mode.eq_ignore_ascii_case("local-placeholder") => Ok(Self::Local),
            Ok(mode) => Err(format!(
                "PHOTO_STORAGE_MODE must be local or s3, received {mode}"
            )),
            _ => Ok(Self::Local),
        }
    }

    pub fn upload_ticket(
        &self,
        job_id: &str,
        photo_type: &str,
        upload_nonce: u128,
        safe_file_name: &str,
        content_type: &str,
    ) -> PhotoStorageTicket {
        match self {
            Self::Local => {
                let object_key =
                    format!("local/jobs/{job_id}/{photo_type}/{upload_nonce}_{safe_file_name}");
                PhotoStorageTicket {
                    upload_mode: "local-placeholder",
                    upload_url: format!("local://{object_key}?content_type={content_type}"),
                    object_key,
                    thumbnail_upload_url: None,
                    thumbnail_object_key: None,
                }
            }
            Self::S3(config) => {
                let object_key =
                    config.object_key(job_id, photo_type, upload_nonce, safe_file_name);
                let thumbnail_object_key =
                    config.thumbnail_object_key(job_id, photo_type, upload_nonce, safe_file_name);
                let upload_url =
                    config.presigned_url("PUT", &object_key, config.upload_expires_seconds);
                let thumbnail_upload_url = config.presigned_url(
                    "PUT",
                    &thumbnail_object_key,
                    config.upload_expires_seconds,
                );
                PhotoStorageTicket {
                    upload_mode: "s3-presigned",
                    upload_url,
                    object_key,
                    thumbnail_upload_url: Some(thumbnail_upload_url),
                    thumbnail_object_key: Some(thumbnail_object_key),
                }
            }
        }
    }

    pub fn display_url(&self, upload_mode: &str, object_key: &str) -> String {
        if upload_mode == "s3-presigned" {
            if let Self::S3(config) = self {
                return config.presigned_url("GET", object_key, config.display_expires_seconds);
            }
        }

        format!("local://{object_key}")
    }

    pub fn thumbnail_url(
        &self,
        upload_mode: &str,
        thumbnail_object_key: Option<&str>,
    ) -> Option<String> {
        let thumbnail_object_key = thumbnail_object_key?;
        if upload_mode == "s3-presigned" {
            if let Self::S3(config) = self {
                return Some(config.presigned_url(
                    "GET",
                    thumbnail_object_key,
                    config.display_expires_seconds,
                ));
            }
        }

        Some(format!("local://{thumbnail_object_key}"))
    }

    pub async fn uploaded_photo_metadata(
        &self,
        upload_mode: &str,
        object_key: &str,
    ) -> Option<PhotoUploadMetadata> {
        if normalized_upload_mode(upload_mode) != "s3-presigned" {
            return None;
        }

        let Self::S3(config) = self else {
            return None;
        };

        config
            .uploaded_photo_metadata(object_key)
            .await
            .ok()
            .flatten()
    }
}

impl S3PhotoStorageConfig {
    fn object_key(
        &self,
        job_id: &str,
        photo_type: &str,
        upload_nonce: u128,
        safe_file_name: &str,
    ) -> String {
        let prefix = self.key_prefix.trim_matches('/');
        if prefix.is_empty() {
            format!("jobs/{job_id}/{photo_type}/{upload_nonce}_{safe_file_name}")
        } else {
            format!("{prefix}/jobs/{job_id}/{photo_type}/{upload_nonce}_{safe_file_name}")
        }
    }

    fn thumbnail_object_key(
        &self,
        job_id: &str,
        photo_type: &str,
        upload_nonce: u128,
        safe_file_name: &str,
    ) -> String {
        let prefix = self.key_prefix.trim_matches('/');
        let thumbnail_file_name = thumbnail_file_name(safe_file_name);
        if prefix.is_empty() {
            format!("thumbnails/jobs/{job_id}/{photo_type}/{upload_nonce}_{thumbnail_file_name}")
        } else {
            format!(
                "{prefix}/thumbnails/jobs/{job_id}/{photo_type}/{upload_nonce}_{thumbnail_file_name}"
            )
        }
    }

    fn presigned_url(&self, method: &str, object_key: &str, expires_seconds: u32) -> String {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_secs())
            .unwrap_or(0);
        self.presigned_url_at(method, object_key, expires_seconds, now)
    }

    async fn uploaded_photo_metadata(
        &self,
        object_key: &str,
    ) -> Result<Option<PhotoUploadMetadata>, reqwest::Error> {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(5))
            .build()?;
        let head_response = client
            .head(self.presigned_url("HEAD", object_key, self.display_expires_seconds))
            .send()
            .await?;

        if !head_response.status().is_success() {
            return Ok(None);
        }

        let file_size_bytes = head_response.content_length().and_then(|content_length| {
            i64::try_from(content_length)
                .ok()
                .filter(|value| *value > 0)
        });
        let range_header = format!("bytes=0-{}", PHOTO_METADATA_RANGE_BYTES - 1);
        let get_response = client
            .get(self.presigned_url("GET", object_key, self.display_expires_seconds))
            .header(RANGE, range_header)
            .send()
            .await?;

        if !get_response.status().is_success()
            && get_response.status() != StatusCode::PARTIAL_CONTENT
        {
            return Ok(None);
        }

        let bytes = get_response.bytes().await?;
        let Some((image_width_px, image_height_px)) = image_dimensions(&bytes) else {
            return Ok(None);
        };

        Ok(Some(PhotoUploadMetadata {
            file_size_bytes: file_size_bytes.or_else(|| i64::try_from(bytes.len()).ok()),
            image_width_px: Some(image_width_px),
            image_height_px: Some(image_height_px),
            metadata_source: Some("server_extracted".to_string()),
        }))
    }

    fn presigned_url_at(
        &self,
        method: &str,
        object_key: &str,
        expires_seconds: u32,
        unix_seconds: u64,
    ) -> String {
        let date_time = aws_date_time(unix_seconds);
        let date = &date_time[..8];
        let host = s3_host(&self.bucket, &self.region);
        let canonical_uri = format!("/{}", uri_encode_path(object_key));
        let credential_scope = format!("{date}/{}/s3/aws4_request", self.region);
        let credential = format!("{}/{}", self.access_key_id, credential_scope);
        let mut query = vec![
            (
                "X-Amz-Algorithm".to_string(),
                "AWS4-HMAC-SHA256".to_string(),
            ),
            ("X-Amz-Credential".to_string(), credential),
            ("X-Amz-Date".to_string(), date_time.clone()),
            ("X-Amz-Expires".to_string(), expires_seconds.to_string()),
            ("X-Amz-SignedHeaders".to_string(), "host".to_string()),
        ];

        if let Some(session_token) = &self.session_token {
            query.push(("X-Amz-Security-Token".to_string(), session_token.clone()));
        }

        let canonical_query = canonical_query_string(&query);
        let canonical_request = format!(
            "{method}\n{canonical_uri}\n{canonical_query}\nhost:{host}\n\nhost\nUNSIGNED-PAYLOAD"
        );
        let string_to_sign = format!(
            "AWS4-HMAC-SHA256\n{date_time}\n{credential_scope}\n{}",
            hex_sha256(canonical_request.as_bytes())
        );
        let signing_key = signing_key(&self.secret_access_key, date, &self.region);
        let signature = hex_hmac(&signing_key, string_to_sign.as_bytes());

        format!("https://{host}{canonical_uri}?{canonical_query}&X-Amz-Signature={signature}")
    }
}

fn required_env(name: &str) -> Result<String, String> {
    std::env::var(name).map_err(|_| format!("{name} is required when PHOTO_STORAGE_MODE=s3"))
}

fn env_u32(name: &str) -> Option<u32> {
    std::env::var(name)
        .ok()
        .and_then(|value| value.parse::<u32>().ok())
}

fn s3_host(bucket: &str, region: &str) -> String {
    if region == "us-east-1" {
        format!("{bucket}.s3.amazonaws.com")
    } else {
        format!("{bucket}.s3.{region}.amazonaws.com")
    }
}

fn canonical_query_string(params: &[(String, String)]) -> String {
    let mut encoded = params
        .iter()
        .map(|(key, value)| (uri_encode(key), uri_encode(value)))
        .collect::<Vec<_>>();
    encoded.sort();
    encoded
        .into_iter()
        .map(|(key, value)| format!("{key}={value}"))
        .collect::<Vec<_>>()
        .join("&")
}

fn signing_key(secret_access_key: &str, date: &str, region: &str) -> Vec<u8> {
    let date_key = hmac_sha256(
        format!("AWS4{secret_access_key}").as_bytes(),
        date.as_bytes(),
    );
    let region_key = hmac_sha256(&date_key, region.as_bytes());
    let service_key = hmac_sha256(&region_key, b"s3");
    hmac_sha256(&service_key, b"aws4_request")
}

fn hmac_sha256(key: &[u8], message: &[u8]) -> Vec<u8> {
    let mut mac = HmacSha256::new_from_slice(key).expect("HMAC accepts any key length");
    mac.update(message);
    mac.finalize().into_bytes().to_vec()
}

fn hex_hmac(key: &[u8], message: &[u8]) -> String {
    hex(&hmac_sha256(key, message))
}

fn hex_sha256(message: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(message);
    hex(&hasher.finalize())
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn uri_encode_path(path: &str) -> String {
    path.split('/')
        .map(uri_encode)
        .collect::<Vec<_>>()
        .join("/")
}

fn thumbnail_file_name(safe_file_name: &str) -> String {
    let stem = safe_file_name
        .rsplit_once('.')
        .map(|(stem, _)| stem)
        .filter(|stem| !stem.is_empty())
        .unwrap_or(safe_file_name);
    format!("{stem}.jpg")
}

fn uri_encode(value: &str) -> String {
    value
        .bytes()
        .flat_map(|byte| match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                vec![byte as char]
            }
            _ => format!("%{byte:02X}").chars().collect(),
        })
        .collect()
}

fn aws_date_time(unix_seconds: u64) -> String {
    let days = (unix_seconds / 86_400) as i64;
    let seconds_of_day = unix_seconds % 86_400;
    let (year, month, day) = civil_from_days(days);
    let hour = seconds_of_day / 3_600;
    let minute = (seconds_of_day % 3_600) / 60;
    let second = seconds_of_day % 60;

    format!("{year:04}{month:02}{day:02}T{hour:02}{minute:02}{second:02}Z")
}

fn civil_from_days(days_since_epoch: i64) -> (i32, u32, u32) {
    let z = days_since_epoch + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = mp + if mp < 10 { 3 } else { -9 };
    let year = y + if m <= 2 { 1 } else { 0 };

    (year as i32, m as u32, d as u32)
}

pub fn normalized_upload_mode(upload_mode: &str) -> &'static str {
    if upload_mode == "s3-presigned" {
        "s3-presigned"
    } else {
        "local-placeholder"
    }
}

fn image_dimensions(bytes: &[u8]) -> Option<(i32, i32)> {
    png_dimensions(bytes)
        .or_else(|| gif_dimensions(bytes))
        .or_else(|| jpeg_dimensions(bytes))
}

fn png_dimensions(bytes: &[u8]) -> Option<(i32, i32)> {
    if bytes.len() < 24 || &bytes[..8] != b"\x89PNG\r\n\x1a\n" || bytes.get(12..16) != Some(b"IHDR")
    {
        return None;
    }

    dimensions_from_u32(read_be_u32(bytes, 16)?, read_be_u32(bytes, 20)?)
}

fn gif_dimensions(bytes: &[u8]) -> Option<(i32, i32)> {
    if bytes.len() < 10 || !(bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a")) {
        return None;
    }

    dimensions_from_u32(
        u16::from_le_bytes([bytes[6], bytes[7]]) as u32,
        u16::from_le_bytes([bytes[8], bytes[9]]) as u32,
    )
}

fn jpeg_dimensions(bytes: &[u8]) -> Option<(i32, i32)> {
    if bytes.len() < 4 || bytes[0] != 0xff || bytes[1] != 0xd8 {
        return None;
    }

    let mut index = 2;
    while index + 3 < bytes.len() {
        while index < bytes.len() && bytes[index] != 0xff {
            index += 1;
        }
        while index < bytes.len() && bytes[index] == 0xff {
            index += 1;
        }
        if index >= bytes.len() {
            return None;
        }

        let marker = bytes[index];
        index += 1;

        if marker == 0xd9 || marker == 0xda {
            return None;
        }
        if marker == 0xd8 || (0xd0..=0xd7).contains(&marker) {
            continue;
        }
        if index + 2 > bytes.len() {
            return None;
        }

        let segment_length = read_be_u16(bytes, index)? as usize;
        if segment_length < 2 || index + segment_length > bytes.len() {
            return None;
        }

        if is_jpeg_start_of_frame(marker) && segment_length >= 7 {
            let height = read_be_u16(bytes, index + 3)? as u32;
            let width = read_be_u16(bytes, index + 5)? as u32;
            return dimensions_from_u32(width, height);
        }

        index += segment_length;
    }

    None
}

fn is_jpeg_start_of_frame(marker: u8) -> bool {
    matches!(
        marker,
        0xc0 | 0xc1 | 0xc2 | 0xc3 | 0xc5 | 0xc6 | 0xc7 | 0xc9 | 0xca | 0xcb | 0xcd | 0xce | 0xcf
    )
}

fn dimensions_from_u32(width: u32, height: u32) -> Option<(i32, i32)> {
    Some((
        i32::try_from(width).ok().filter(|value| *value > 0)?,
        i32::try_from(height).ok().filter(|value| *value > 0)?,
    ))
}

fn read_be_u16(bytes: &[u8], index: usize) -> Option<u16> {
    Some(u16::from_be_bytes([
        *bytes.get(index)?,
        *bytes.get(index + 1)?,
    ]))
}

fn read_be_u32(bytes: &[u8], index: usize) -> Option<u32> {
    Some(u32::from_be_bytes([
        *bytes.get(index)?,
        *bytes.get(index + 1)?,
        *bytes.get(index + 2)?,
        *bytes.get(index + 3)?,
    ]))
}

#[cfg(test)]
mod tests {
    use super::{
        aws_date_time, canonical_query_string, image_dimensions, uri_encode, PhotoStorageConfig,
        S3PhotoStorageConfig,
    };

    #[test]
    fn local_storage_ticket_matches_existing_placeholder_shape() {
        let ticket = PhotoStorageConfig::Local.upload_ticket(
            "job_1001",
            "before",
            123,
            "front-yard.jpg",
            "image/jpeg",
        );

        assert_eq!(ticket.upload_mode, "local-placeholder");
        assert_eq!(
            ticket.object_key,
            "local/jobs/job_1001/before/123_front-yard.jpg"
        );
        assert_eq!(
            ticket.upload_url,
            "local://local/jobs/job_1001/before/123_front-yard.jpg?content_type=image/jpeg"
        );
        assert_eq!(ticket.thumbnail_upload_url, None);
        assert_eq!(ticket.thumbnail_object_key, None);
    }

    #[test]
    fn s3_storage_ticket_returns_presigned_put_url() {
        let config = PhotoStorageConfig::S3(S3PhotoStorageConfig {
            bucket: "grover-dev-photos".to_string(),
            region: "us-west-2".to_string(),
            access_key_id: "AKIDEXAMPLE".to_string(),
            secret_access_key: "secret".to_string(),
            session_token: None,
            key_prefix: "evidence".to_string(),
            upload_expires_seconds: 600,
            display_expires_seconds: 300,
        });

        let ticket = config.upload_ticket("job_1001", "after", 99, "after.jpg", "image/jpeg");

        assert_eq!(ticket.upload_mode, "s3-presigned");
        assert_eq!(
            ticket.object_key,
            "evidence/jobs/job_1001/after/99_after.jpg"
        );
        assert_eq!(
            ticket.thumbnail_object_key.as_deref(),
            Some("evidence/thumbnails/jobs/job_1001/after/99_after.jpg")
        );
        assert!(ticket.upload_url.starts_with(
            "https://grover-dev-photos.s3.us-west-2.amazonaws.com/evidence/jobs/job_1001/after/99_after.jpg?"
        ));
        assert!(ticket
            .thumbnail_upload_url
            .as_deref()
            .unwrap_or("")
            .starts_with(
                "https://grover-dev-photos.s3.us-west-2.amazonaws.com/evidence/thumbnails/jobs/job_1001/after/99_after.jpg?"
            ));
        assert!(ticket
            .upload_url
            .contains("X-Amz-Algorithm=AWS4-HMAC-SHA256"));
        assert!(ticket.upload_url.contains("X-Amz-SignedHeaders=host"));
    }

    #[test]
    fn s3_display_url_is_presigned_for_s3_rows_only() {
        let config = PhotoStorageConfig::S3(S3PhotoStorageConfig {
            bucket: "grover-dev-photos".to_string(),
            region: "us-east-1".to_string(),
            access_key_id: "AKIDEXAMPLE".to_string(),
            secret_access_key: "secret".to_string(),
            session_token: Some("session/token".to_string()),
            key_prefix: "photos".to_string(),
            upload_expires_seconds: 600,
            display_expires_seconds: 120,
        });

        let display_url = config.display_url("s3-presigned", "photos/jobs/job_1001/before/a.jpg");
        assert!(display_url.starts_with(
            "https://grover-dev-photos.s3.amazonaws.com/photos/jobs/job_1001/before/a.jpg?"
        ));
        assert!(display_url.contains("X-Amz-Expires=120"));
        assert!(display_url.contains("X-Amz-Security-Token=session%2Ftoken"));
        assert_eq!(
            config.display_url("local-placeholder", "local/jobs/job_1001/before/a.jpg"),
            "local://local/jobs/job_1001/before/a.jpg"
        );

        let thumbnail_url = config.thumbnail_url(
            "s3-presigned",
            Some("photos/thumbnails/jobs/job_1001/before/a.jpg"),
        );
        assert!(thumbnail_url
            .as_deref()
            .unwrap_or("")
            .starts_with(
                "https://grover-dev-photos.s3.amazonaws.com/photos/thumbnails/jobs/job_1001/before/a.jpg?"
            ));
    }

    #[test]
    fn aws_date_format_uses_utc_calendar() {
        assert_eq!(aws_date_time(0), "19700101T000000Z");
        assert_eq!(aws_date_time(1_704_067_200), "20240101T000000Z");
    }

    #[test]
    fn canonical_query_sorting_percent_encodes_values() {
        let query = canonical_query_string(&[
            ("X-Amz-Security-Token".to_string(), "a/b c".to_string()),
            ("X-Amz-Date".to_string(), "20240101T000000Z".to_string()),
        ]);

        assert_eq!(
            query,
            "X-Amz-Date=20240101T000000Z&X-Amz-Security-Token=a%2Fb%20c"
        );
        assert_eq!(
            uri_encode("jobs/before photo.jpg"),
            "jobs%2Fbefore%20photo.jpg"
        );
    }

    #[test]
    fn image_dimensions_reads_png_gif_and_jpeg_headers() {
        let mut png = vec![0x89, b'P', b'N', b'G', b'\r', b'\n', 0x1a, b'\n'];
        png.extend_from_slice(&[0, 0, 0, 13]);
        png.extend_from_slice(b"IHDR");
        png.extend_from_slice(&1600_u32.to_be_bytes());
        png.extend_from_slice(&900_u32.to_be_bytes());

        let mut gif = b"GIF89a".to_vec();
        gif.extend_from_slice(&1600_u16.to_le_bytes());
        gif.extend_from_slice(&900_u16.to_le_bytes());

        let jpeg = vec![
            0xff, 0xd8, 0xff, 0xc0, 0x00, 0x07, 0x08, 0x03, 0x84, 0x06, 0x40,
        ];

        assert_eq!(image_dimensions(&png), Some((1600, 900)));
        assert_eq!(image_dimensions(&gif), Some((1600, 900)));
        assert_eq!(image_dimensions(&jpeg), Some((1600, 900)));
    }

    #[test]
    fn image_dimensions_rejects_incomplete_headers() {
        assert_eq!(image_dimensions(b"not an image"), None);
        assert_eq!(image_dimensions(&[0xff, 0xd8, 0xff, 0xc0, 0x00]), None);
    }
}
