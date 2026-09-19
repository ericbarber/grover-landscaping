# AWS Account Setup for the Protected Pilot

This runbook prepares the AWS ownership and operator access required by the
Grover Landscaping protected pilot. It does not deploy the application.

Last verified against the linked AWS and HashiCorp documentation: 2026-09-19.
Recheck the linked billing and console guidance if this runbook is used later.

The current production design uses AWS for:

- Amazon Cognito user pools, managed login, application groups, and pilot users.
- A private S3 photo-evidence bucket only when photo storage is explicitly
  enabled.
- A versioned S3 bucket for production Terraform state after the backend
  decision is recorded.

Render, not AWS, hosts the application container and PostgreSQL for this pilot.
Do not create EC2, ECS, RDS, or an AWS load balancer for this phase.

## Information to prepare

Use business-controlled addresses and a password manager that does not depend
on the AWS account being recovered.

- A unique shared mailbox for the AWS Organizations management-account root.
- A second unique shared mailbox for the production member-account root.
- Billing, security, and operations distribution addresses.
- A reachable business phone number for account recovery.
- A payment method and the approved monthly AWS budget.
- Two independent MFA devices for the management-account root.
- The intended operating Region. This repository defaults production to
  `us-east-1`.

Do not put root passwords, MFA recovery material, access keys, session tokens,
or payment details in this repository or project chat.

## 1. Choose the account boundary

The recommended production boundary is:

```text
AWS Organizations management account
└── Grover production member account
    ├── Cognito production user pool
    ├── optional S3 photo bucket
    └── S3 Terraform state bucket
```

Keep business workloads out of the management account. AWS recommends using
that account only for organization-wide administration because service control
policies do not restrict it. The production member account provides a separate
security, billing, and quota boundary.

Before enabling AWS Organizations, review the notice in AWS's
[IAM Identity Center enablement guide](https://docs.aws.amazon.com/singlesignon/latest/userguide/enable-identity-center.html).
AWS currently states that creating an organization from a Free plan account
changes its plan and can end Free Tier credits. Stop here and resolve that
billing decision if preserving those credits matters.

## 2. Create and secure the management account

1. Follow AWS's [account sign-up guide](https://docs.aws.amazon.com/accounts/latest/reference/getting-started.html)
   and create the management account with its dedicated shared root mailbox.
2. Verify the email address, contact information, phone number, and payment
   method.
3. Sign in as root only for this initial security setup.
4. Set a unique root password and register at least two MFA devices, preferably
   including a hardware security key stored separately from the password.
5. Confirm the root user has no access keys. Do not create any.
6. Add billing, operations, and security alternate contacts. Distribution lists
   are preferable to a single person's address.
7. Sign out of root after the administrative identity is working.

AWS documents the root-user controls in
[Root user best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/root-user-best-practices.html)
and the contact fields in
[Update alternate contacts](https://docs.aws.amazon.com/accounts/latest/reference/manage-acct-update-contact-alternate.html).

## 3. Enable workforce access

Use an organization instance of IAM Identity Center so people receive temporary
sessions instead of long-lived IAM access keys.

1. In `us-east-1`, open **IAM Identity Center** and choose **Enable with AWS
   Organizations**.
2. Record the Identity Center Region and AWS access-portal URL in the restricted
   operations record.
3. Create a named administrator user or connect the approved workforce identity
   provider.
4. Require MFA and register a backup authenticator.
5. Create an `AdministratorAccess` permission set for initial organization and
   account setup, assign it only to the initial administrator, and verify access
   through the AWS access portal.
6. Stop using the root session.

Follow AWS's current
[IAM Identity Center getting-started guide](https://docs.aws.amazon.com/singlesignon/latest/userguide/getting-started.html)
and [MFA configuration guide](https://docs.aws.amazon.com/singlesignon/latest/userguide/mfa-configure.html).
Keep management-account access limited to people who perform organization-wide
administration.

## 4. Create the production member account

From the AWS Organizations management account:

1. Open **AWS Organizations** and choose **Add an AWS account** then **Create an
   AWS account**.
2. Use a name such as `Grover Production` and the dedicated production root
   mailbox. Root email addresses must be unique across AWS accounts.
3. Create a `Workloads` organizational unit and place the production account in
   it.
4. In IAM Identity Center, assign the initial administrator to the new account
   with `AdministratorAccess` for bootstrap.
5. Sign into the production account through the access portal and add its
   billing, security, and operations alternate contacts.
6. Enable centralized root access for member accounts and retain the new
   production account's secure-by-default state with no root credentials. If a
   root-only recovery task ever requires temporary member-root credentials,
   protect that session with MFA and remove the credentials again afterward.
7. Record the 12-digit production account ID in the restricted operations
   record. An account ID is an identifier, not a credential.

Use the AWS procedure for
[creating a member account](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_create.html).
AWS documents the preferred credentialless member-account posture in
[Centralize root access for member accounts](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-enable-root-access.html).
Do not deploy Grover resources into the management account.

## 5. Configure cost and activity safeguards

Complete these before applying the production Terraform plan:

1. In **Billing and Cost Management**, create a recurring monthly cost budget
   at the approved pilot amount.
2. Add actual-spend notifications at early, middle, and full-budget thresholds
   and a forecasted-spend notification. Use monitored distribution addresses.
3. Create an AWS-managed services monitor in **Cost Anomaly Detection** and an
   alert subscription with a deliberately low pilot threshold.
4. In **CloudTrail**, create a multi-Region trail for management events and send
   it to a dedicated, private, encrypted, versioned logging bucket. Retain it
   according to the project's operational and privacy policy.
5. Confirm the alert recipients received and accepted any required
   subscriptions.

Use the current AWS instructions for
[creating a cost budget](https://docs.aws.amazon.com/cost-management/latest/userguide/create-cost-budget.html),
[Cost Anomaly Detection](https://docs.aws.amazon.com/cost-management/latest/userguide/getting-started-ad.html),
and [creating a multi-Region CloudTrail trail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-create-a-trail-using-the-console-first-time.html).
Budget notifications are monitoring controls; keep reviewing the Billing
dashboard and do not treat an alert as an automatic spending cap.

## 6. Configure temporary CLI access

Install AWS CLI version 2 from AWS's
[official installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html),
then create an IAM Identity Center profile:

```bash
aws configure sso --profile grover-prod-admin
aws sso login --profile grover-prod-admin
aws sts get-caller-identity --profile grover-prod-admin
```

The final command must report the production member-account ID and an assumed
Identity Center role. It must not report the management account or a root user.

For the current shell session:

```bash
export AWS_PROFILE=grover-prod-admin
export AWS_REGION=us-east-1
export AWS_DEFAULT_REGION=us-east-1
aws sts get-caller-identity
```

AWS documents this temporary-credential flow in
[Configure IAM Identity Center authentication with the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html).
Do not run `aws configure` with permanent access-key values, and never create
root access keys.

## 7. Establish the Terraform operator boundary

The initial administrator may bootstrap the account, but routine Terraform
operations should use a separate `GroverTerraformOperator` permission set.
Start with temporary `PowerUserAccess` only for the first controlled plan if a
reviewed custom policy is not ready, then replace it with least privilege from
the observed plan and CloudTrail activity.

The current production Terraform requires access only to:

- `sts:GetCallerIdentity`;
- the Grover production Cognito user pool, client, domain, and groups;
- the optional Grover production S3 photo bucket and its public-access,
  ownership, encryption, versioning, CORS, lifecycle, and tagging settings;
- the exact Terraform-state bucket, state object, and `.tflock` object.

It does not currently create IAM roles, compute, networking, or databases in
AWS. Do not add `iam:PassRole`, organization administration, or unrelated
service access unless a reviewed Terraform change requires it.

Follow AWS's [IAM security best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html):
use federation and temporary credentials, require MFA, review unused access,
and reduce permissions after observing the required operations.

## 8. Create the remote-state bucket

Create the state bucket in the production member account before the application
Terraform is initialized. The bucket must not be managed by the same state it
stores.

Choose a globally unique, lowercase bucket name, for example
`grover-landscaping-prod-tfstate-123456789012-unique`. Replace the example value
before running these commands:

```bash
export AWS_PROFILE=grover-prod-admin
export AWS_REGION=us-east-1
export GROVER_STATE_BUCKET=grover-landscaping-prod-tfstate-123456789012-unique

aws sts get-caller-identity
aws s3api create-bucket \
  --bucket "${GROVER_STATE_BUCKET}" \
  --region "${AWS_REGION}"
aws s3api put-public-access-block \
  --bucket "${GROVER_STATE_BUCKET}" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-ownership-controls \
  --bucket "${GROVER_STATE_BUCKET}" \
  --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerEnforced}]'
aws s3api put-bucket-encryption \
  --bucket "${GROVER_STATE_BUCKET}" \
  --server-side-encryption-configuration \
  'Rules=[{ApplyServerSideEncryptionByDefault={SSEAlgorithm=AES256}}]'
aws s3api put-bucket-versioning \
  --bucket "${GROVER_STATE_BUCKET}" \
  --versioning-configuration Status=Enabled
aws s3api put-bucket-tagging \
  --bucket "${GROVER_STATE_BUCKET}" \
  --tagging 'TagSet=[{Key=Application,Value=grover-landscaping},{Key=Environment,Value=prod},{Key=ManagedBy,Value=account-bootstrap},{Key=DataClass,Value=terraform-state}]'
```

Copy
[`aws-terraform-state-bucket-policy.template.json`](aws-terraform-state-bucket-policy.template.json)
to a restricted temporary location, replace both occurrences of
`REPLACE_WITH_ACTUAL_STATE_BUCKET_NAME`, inspect the resulting JSON, and enforce
TLS-only requests:

```bash
aws s3api put-bucket-policy \
  --bucket "${GROVER_STATE_BUCKET}" \
  --policy file:///restricted/path/grover-state-bucket-policy.json
```

The policy contains no credential, but use the actual bucket name and do not
apply it to any other bucket.

Verify the controls:

```bash
aws s3api get-public-access-block --bucket "${GROVER_STATE_BUCKET}"
aws s3api get-bucket-ownership-controls --bucket "${GROVER_STATE_BUCKET}"
aws s3api get-bucket-encryption --bucket "${GROVER_STATE_BUCKET}"
aws s3api get-bucket-versioning --bucket "${GROVER_STATE_BUCKET}"
aws s3api get-bucket-tagging --bucket "${GROVER_STATE_BUCKET}"
aws s3api get-bucket-policy-status --bucket "${GROVER_STATE_BUCKET}"
```

The policy status must report `IsPublic: false`. Remove the restricted temporary
policy copy after AWS accepts it; the source-controlled template remains.

Record these non-secret backend inputs in the restricted operations record:

```text
bucket = <actual state bucket name>
key = grover-landscaping/prod/terraform.tfstate
region = us-east-1
use_lockfile = true
encrypt = true
```

HashiCorp recommends S3 bucket versioning for state recovery and supports S3
lock files through `use_lockfile = true`; DynamoDB-based locking is deprecated.
See the [Terraform S3 backend documentation](https://developer.hashicorp.com/terraform/language/backend/s3).
Never put AWS credentials in a backend configuration file, Terraform variables,
the repository, or a plan file.

The repository does not yet declare the production S3 backend. Creating and
verifying this bucket completes the AWS account setup, but do not run production
`terraform apply` until the backend configuration is reviewed, the existing
state position is confirmed, and `TERRAFORM_STATE_CONFIRMED=1` is justified.

## 9. Account-setup acceptance checklist

- [ ] Management root uses a business-controlled mailbox, a unique password,
      two MFA devices, and no access keys.
- [ ] The production member account has centralized root access and no
      recoverable root credentials; any exception is documented and MFA-
      protected.
- [ ] Management and production alternate contacts are current.
- [ ] IAM Identity Center is enabled in the recorded Region and requires MFA.
- [ ] The administrator can reach the production member account through the
      access portal.
- [ ] `aws sts get-caller-identity` reports the production account and an
      assumed role using the `grover-prod-admin` profile.
- [ ] A monthly budget, cost anomaly monitor, and confirmed alert recipients
      exist.
- [ ] A multi-Region CloudTrail trail records management activity outside the
      workload resources.
- [ ] The Terraform-state bucket is private, encrypted, versioned, and owned by
      the production account.
- [ ] The state bucket name, state key, AWS Region, production account ID, and
      Identity Center access owner are recorded without credentials.
- [ ] No Cognito, S3 photo, or other Grover workload has been manually created;
      those resources remain Terraform-owned.

## Safe handoff values

After this checklist passes, development needs only these non-secret facts:

```text
AWS production account ID: <12 digits>
AWS workload Region: us-east-1
Terraform state bucket: <bucket name>
Terraform state key: grover-landscaping/prod/terraform.tfstate
Terraform S3 lock file: enabled
CLI profile verified locally: grover-prod-admin
Photo storage for initial pilot: disabled or enabled
```

Do not send the root email, root password, MFA material, AWS access-portal
session, access keys, CLI cache, Cognito access token, or any Terraform state
contents. After the non-secret handoff, continue with the
[Hosted Pilot Runbook](hosted-pilot-runbook.md).
