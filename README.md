# Infisical SSH Action

This GitHub Action enables you to issues ssh keys from Infisical—whether hosted in the cloud or self-hosted—directly into your GitHub workflows.

## Configuration

- In order to use this, you will need to configure a [Machine Identity](https://infisical.com/docs/documentation/platform/identities/machine-identities) for your project.

### Universal Auth

- Configure a machine identity to have an auth method of "Universal Auth".
- Get the machine identity's `client_id` and `client_secret` and store them as Github secrets (recommended) or environment variables.
- Set the `client-id` and `client-secret` input parameters.

## Usage


Exports key to a file in your `GITHUB_WORKSPACE`.

```yaml
- uses: https://gitea.likablehair.it/Likablehair/infisical-ssh-action@v1.0.7
  with:
    domain: "https://app.infisical.com" # Update to the instance URL when using EU (https://eu.infisical.com), a dedicated instance, or a self-hosted instance
    client-id: <your-client-id>
    client-secret: <your-client-secret>
    certificate-template-id: <your-certificate-template-id>
    principals: <comma-separated-list-of-principals> 
    ttl: <key-ttl> # defaults to your template's default TTL
    key-algorithm: <key-algorithm> # defaults to RSA_4096
    file-output-path: "/keys" # defaults to "/keys"
```

**Note**: Make sure to configure an `actions/checkout` step before using this action in file export mode

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v4
```

## Inputs

### `domain`

**Optional**. Infisical URL. Defaults to https://app.infisical.com. If you're using Infisical EU (https://eu.infisical.com) or a self-hosted/dedicated instance, you will need to set the appropriate value for this field.

### `client-id`

**Required**. Machine Identity client ID

### `client-secret`

**Required**. Machine Identity secret key

### `certificate-template-id`

**Required**. The ID of the certificate template to use for generating the SSH key.

### `principals`

**Required**. Comma-separated list of principals (users or groups) that the SSH key will be associated with. This is used to define who can use the generated SSH key.

### `ttl`

**Optional**. The time-to-live (TTL) for the SSH key in seconds. Defaults to the template's default TTL. If not specified, the key will use the default TTL defined in the certificate template.

### `key-algorithm`

**Optional**. The algorithm to use for generating the SSH key. Defaults to `RSA_4096`.

### `file-output-path`

**Optional**. The path to save the file when export-type is set to `file`. Defaults to `/keys`. If you want to save the file in a different location, you can specify the desired path here.
