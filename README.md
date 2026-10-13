# Infisical SSH Action

Issue short-lived SSH certificates from [Infisical](https://infisical.com) (cloud or self-hosted) directly inside your Gitea / GitHub Actions workflows.

The action authenticates with a Machine Identity, asks Infisical to issue a signed SSH key pair from a certificate template, and writes the keys to your workspace so later steps can use them with `ssh`, `scp`, `rsync`, etc.

## How it works

1. Logs in to Infisical using [Universal Auth](https://infisical.com/docs/documentation/platform/identities/universal-auth).
2. Calls the Infisical SSH API (`POST /api/v1/ssh/certificates/issue`) with your certificate template, principals, TTL and key algorithm.
3. Writes three files to `$GITHUB_WORKSPACE<file-output-path>` (default: `$GITHUB_WORKSPACE/keys`):

| File              | Content                             |
| ----------------- | ----------------------------------- |
| `id_rsa`          | Private key                         |
| `id_rsa.pub`      | Public key                          |
| `id_rsa-cert.pub` | SSH certificate signed by Infisical |

> The file names are always `id_rsa*`, regardless of the `key-algorithm` you choose.

## Prerequisites

1. An SSH **certificate template** in your Infisical project, and the SSH CA's public key trusted by the target hosts (`TrustedUserCAKeys` in `sshd_config`).
2. A [Machine Identity](https://infisical.com/docs/documentation/platform/identities/machine-identities) with the **Universal Auth** method, with access to the project that owns the certificate template.
3. The identity's `client_id` and `client_secret` stored as repository/organization secrets (e.g. `INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET`).

## Usage

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v4

  - name: Issue SSH certificate
    uses: https://gitea.likablehair.it/Likablehair/infisical-ssh-action@v1.0.7
    with:
      domain: "https://app.infisical.com"        # or https://eu.infisical.com / your self-hosted URL
      client-id: ${{ secrets.INFISICAL_CLIENT_ID }}
      client-secret: ${{ secrets.INFISICAL_CLIENT_SECRET }}
      certificate-template-id: ${{ vars.INFISICAL_SSH_TEMPLATE_ID }}
      principals: "deploy"                        # comma-separated, e.g. "deploy,ubuntu"
      ttl: "15m"                                  # optional, defaults to "1h"
      key-algorithm: "RSA_4096"                   # optional, defaults to RSA_4096
      file-output-path: "/keys"                   # optional, defaults to "/keys"

  - name: Deploy over SSH
    run: |
      chmod 600 keys/id_rsa
      ssh -i keys/id_rsa \
          -o CertificateFile=keys/id_rsa-cert.pub \
          -o StrictHostKeyChecking=accept-new \
          deploy@my-server.example.com 'echo connected'
```

> **Run `actions/checkout` before this action.** Checkout cleans the workspace, so running it afterwards would delete the generated keys.

## Inputs

| Name                      | Required | Default                     | Description                                                                                                                         |
| ------------------------- | :------: | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `domain`                  |    No    | `https://app.infisical.com` | Infisical instance URL. Set it for Infisical EU (`https://eu.infisical.com`), dedicated, or self-hosted instances. No trailing `/`. |
| `client-id`               |   Yes    | —                           | Machine Identity Universal Auth client ID.                                                                                          |
| `client-secret`           |   Yes    | —                           | Machine Identity Universal Auth client secret.                                                                                      |
| `certificate-template-id` |   Yes    | —                           | ID of the Infisical SSH certificate template used to issue the key.                                                                 |
| `principals`              |   Yes    | —                           | Comma-separated list of principals (usernames) the certificate is valid for. Must be allowed by the template.                       |
| `ttl`                     |    No    | `1h`                        | Certificate lifetime, e.g. `15m`, `1h`. Must not exceed the template's max TTL.                                                     |
| `key-algorithm`           |    No    | `RSA_4096`                  | Key algorithm, e.g. `RSA_2048`, `RSA_4096`, `EC_prime256v1`, `EC_secp384r1`.                                                        |
| `file-output-path`        |    No    | `/keys`                     | Directory, relative to `$GITHUB_WORKSPACE`, where the keys are written. Must start with `/`. Created if missing.                    |

## Outputs

This action has no outputs; the keys are written to files (see [How it works](#how-it-works)).

## Security notes

- Always pass `client-id` and `client-secret` via secrets, never in plain text.
- Keep `ttl` as short as your job needs; the certificate stops working once it expires.
- The keys live in the workspace: don't commit them, don't include them in uploaded artifacts, and consider adding the output directory to `.gitignore`.
- The private key is written with default file permissions; run `chmod 600` on it before using it with `ssh`.
- On self-hosted / persistent runners, remove the keys at the end of the job:

  ```yaml
  - name: Remove SSH keys
    if: always()
    run: rm -rf keys
  ```

## Troubleshooting

- **`Missing universal auth credentials`** — `client-id` or `client-secret` is empty. Check the secret names and that they are available to the workflow.
- **401 / 403 from Infisical** — the identity is not using Universal Auth, the credentials are wrong, or the identity has no access to the project owning the certificate template.
- **`Permission denied (publickey)` on the host** — make sure the host trusts the Infisical SSH CA, the login user is one of the `principals`, and the certificate hasn't expired. Run `ssh-keygen -L -f keys/id_rsa-cert.pub` to inspect it.
- Enable step debug logging (`ACTIONS_STEP_DEBUG=true`) to see the issued key's serial number and algorithm.

## Development

Requires Node.js 20 (see `.nvmrc`). Dependencies are committed in `node_modules`, so after changing them run `npm install` and commit the result.

## License

See [LICENSE](LICENSE).
