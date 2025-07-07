import axios from "axios";
import * as core from "@actions/core";
import querystring from "querystring";

export const UALogin = async ({ clientId, clientSecret, domain }) => {
  const loginData = querystring.stringify({
    clientId,
    clientSecret,
  });

  try {
    const response = await axios({
      method: "post",
      url: `${domain}/api/v1/auth/universal-auth/login`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: loginData,
    });
    return response.data.accessToken;
  } catch (err) {
    core.error(err.response?.data?.message || err.message);
    throw err;
  }
};

export const oidcLogin = async ({ identityId, domain, oidcAudience }) => {
  const idToken = await core.getIDToken(oidcAudience);

  const loginData = querystring.stringify({
    identityId,
    jwt: idToken,
  });

  try {
    const response = await axios({
      method: "post",
      url: `${domain}/api/v1/auth/oidc-auth/login`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: loginData,
    });

    return response.data.accessToken;
  } catch (err) {
    core.error(err.response?.data?.message || err.message);
    throw err;
  }
};

export const getRawKeys = async ({
  domain,
  infisicalToken,
  certificateTemplateId,
  principals,
  ttl,
  keyAlgorithm,
}) => {
  try {
    const principalsArray = principals.split(",").map((p) => p.trim());

    const response = await axios({
      method: "post",
      url: `${domain}/api/v1/ssh/certificates/issue`,
      headers: {
        Authorization: `Bearer ${infisicalToken}`,
      },
      data: {
        certificateTemplateId,
        principals: principalsArray,
        ttl,
        keyAlgorithm,
      },
    });

    return response.data;
  } catch (err) {
    core.error(err.response?.data?.message || err.message);
    throw err;
  }
};
