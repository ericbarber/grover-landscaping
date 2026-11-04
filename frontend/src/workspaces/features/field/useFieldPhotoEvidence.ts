import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { ApiRequestError } from '../../../api/apiError';
import {
  fetchJobPhotoEvidence,
  type PhotoUploadTicket,
} from '../../../api/client';
import { mergePhotoEvidence } from './fieldWorkspace';

export type FieldPhotoEvidenceRead =
  | { state: 'ready'; photos: PhotoUploadTicket[] }
  | { state: 'fallback' | 'unavailable'; photos: null };

export async function readFieldPhotoEvidence(
  jobId: string,
  load: (jobId: string) => Promise<PhotoUploadTicket[]> = fetchJobPhotoEvidence,
): Promise<FieldPhotoEvidenceRead> {
  try {
    return { state: 'ready', photos: await load(jobId) };
  } catch (error) {
    return {
      state: error instanceof ApiRequestError ? 'unavailable' : 'fallback',
      photos: null,
    };
  }
}

export interface FieldPhotoEvidence {
  uploadTickets: PhotoUploadTicket[];
  setUploadTickets: Dispatch<SetStateAction<PhotoUploadTicket[]>>;
  photoEvidenceUnavailable: boolean;
}

export function useFieldPhotoEvidence(selectedJobId: string | null): FieldPhotoEvidence {
  const [uploadTickets, setUploadTickets] = useState<PhotoUploadTicket[]>([]);
  const [photoEvidenceUnavailable, setPhotoEvidenceUnavailable] = useState(false);

  useEffect(() => {
    if (!selectedJobId) {
      setPhotoEvidenceUnavailable(false);
      return;
    }

    let active = true;
    setPhotoEvidenceUnavailable(false);

    void readFieldPhotoEvidence(selectedJobId).then((result) => {
      if (!active) return;
      setPhotoEvidenceUnavailable(result.state === 'unavailable');
      if (result.photos) {
        setUploadTickets((current) => mergePhotoEvidence(current, selectedJobId, result.photos));
      }
    });

    return () => {
      active = false;
    };
  }, [selectedJobId]);

  return { uploadTickets, setUploadTickets, photoEvidenceUnavailable };
}
