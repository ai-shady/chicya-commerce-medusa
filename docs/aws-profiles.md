# Two AWS accounts on one Mac

This project deploys to a **personal** AWS account (`039314424497`, `us-west-2`).
The Mac's `default` profile points at the **company** account, so every AWS
command must say which account it wants.

AWS CLI has no "current profile" of its own: a profile is chosen per command by
`--profile <name>`, `AWS_PROFILE=<name>`, or the per-block `AWS_DEFAULT_PROFILE`.

## Profile layout

`~/.aws/config` (no secrets, safe to commit mentally):

```ini
[default]
region = eu-central-1

[profile chicya]
region = us-west-2
output = json
```

`~/.aws/credentials` holds the keys per profile:

```ini
[default]
aws_access_key_id = ...
aws_secret_access_key = ...

[chicya]
aws_access_key_id = ...
aws_secret_access_key = ...
```

The `[profile chicya]` block is already in `~/.aws/config`. What is still needed
is its credentials, one of:

```bash
# static keys (what this account uses)
aws configure --profile chicya

# or, if the account has an IAM Identity Center instance
aws configure sso --profile chicya
aws sso login --profile chicya
```

`aws configure --profile chicya` asks for the access key, the secret, and the
region; leave the region as `us-west-2` or just press enter, it is already set.

## Using it

```bash
aws sts get-caller-identity --profile chicya      # account 039314424497
aws sts get-caller-identity                       # company (default)

AWS_PROFILE=chicya aws ecr describe-repositories --region us-west-2
export AWS_PROFILE=chicya                         # rest of this shell only
```

Prefer an explicit `--profile` or `AWS_PROFILE` over editing `default`: an
accidentally-company call against personal resources fails with an auth error,
but the reverse (a personal call against company resources, or the company's
CIDR/ECR being written) is much harder to notice.

Per-directory default without extra tooling — a wrapper:

```bash
# ~/.zshrc
chicya() { AWS_PROFILE=chicya "$@"; }
chicya aws sts get-caller-identity
```

With [direnv](https://direnv.net) (`brew install direnv`, then
`eval "$(direnv hook zsh)"` in `~/.zshrc`) drop a `.envrc` in this repo:

```bash
export AWS_PROFILE=chicya
export AWS_REGION=us-west-2
```

and `cd` into the repo switches the account automatically.

## How this project actually deploys

Nothing on the Mac needs AWS credentials for a normal release:

- `.github/workflows/deploy-backend.yml` authenticates with **GitHub OIDC**
  (`role-to-assume`), builds the image, pushes to ECR and runs
  `deploy/deploy.sh` on the EC2 instance through SSM. No long-lived keys.
- `deploy/deploy.sh` executes **on the instance**, using its instance profile
  (which already lives in the personal account).
- `deploy.sh` now aborts unless the caller identity is account `039314424497`,
  so a run with the company profile fails instead of touching the wrong account.

Local AWS CLI is needed only for ad-hoc work: opening a Session Manager shell,
inspecting the ECR repo, reading CloudWatch logs, or running the script by hand:

```bash
AWS_PROFILE=chicya aws ssm start-session --target <instance-id> --region us-west-2
```
