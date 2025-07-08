import * as core from "@actions/core";
import { UALogin, getRawKeys } from "./infisical.js";
import fs from "fs/promises";

core.info("Starting Infisical SSH Action");

try {
  const UAClientId = core.getInput("client-id");
  const UAClientSecret = core.getInput("client-secret");
  const domain = core.getInput("domain");
  const certificateTemplateId = core.getInput("certificate-template-id");
  const principals = core.getInput("principals");
  const ttl = core.getInput("ttl");
  const keyAlgorithm = core.getInput("key-algorithm");
  const fileOutputPath = core.getInput("file-output-path");

  // get infisical token using UA credentials
  core.info("Logging in to Infisical...");
  let infisicalToken;
  if (!(UAClientId && UAClientSecret)) {
    throw new Error("Missing universal auth credentials");
  }
  infisicalToken = await UALogin({
    domain,
    clientId: UAClientId,
    clientSecret: UAClientSecret,
  });
  core.info("Successfully logged in to Infisical");

  // Issue key from Infisical using input params
  core.info("Issuing key from Infisical...");
  const rawKeys = await getRawKeys({
    domain,
    infisicalToken,
    certificateTemplateId,
    principals,
    ttl,
    keyAlgorithm,
  });

  core.debug(
    `Exporting the key : ${rawKeys.serialNumber} with algorithm ${rawKeys.keyAlgorithm}`
  );

  try {
    const filePath = `${process.env.GITHUB_WORKSPACE}${fileOutputPath}`;
    core.info(`Exporting keys to ${filePath}`);

    await fs.mkdir(filePath, { recursive: true });
    await fs.writeFile(filePath + '/id_rsa', rawKeys.privateKey);
    await fs.writeFile(filePath + '/id_rsa.pub', rawKeys.publicKey);
    await fs.writeFile(filePath + '/id_rsa-cert.pub', rawKeys.signedKey);
  } catch (err) {
    core.error(`Error writing file: ${err.message}`);
    throw err;
  }

  core.info("Successfully exported key to file");
} catch (error) {
  core.setFailed(error.message);
}
