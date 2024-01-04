const core = require("@actions/core");
const github = require("@actions/github");
const sodium = require("tweetsodium");

const token = core.getInput("token");
const octokit = github.getOctokit(token);

const name = input("name", "");
const value = core.getInput("value");

const push_to_org = (input("org", "") !== "");
const visibility = input("visibility", "all");
const owner = input("owner", github.context.payload.repository.owner.login);
const repository = input("repository", github.context.payload.repository.name);

function path_() {

  if (push_to_org) return "/orgs/" + owner;
  if (repository.includes("/")) return "/repos/" + repository;

  return "/repos/" + owner + "/" + repository;

}

function input(name, def) {

  let inp = core.getInput(name).trim();
  if (inp === "" || inp.toLowerCase() === "false") return def;

  return inp;

}

const getPublicKey = async () => {

  let url = "GET " + path_();
  url += "/actions/secrets/public-key";

  let { data } = await octokit.request(url);

  return data;
};

const createSecret = async (key_id, key, secret) => {

  const messageBytes = Buffer.from(secret);
  const keyBytes = Buffer.from(key, "base64");
  const encryptedBytes = sodium.seal(messageBytes, keyBytes);

  return {
    encrypted_value: Buffer.from(encryptedBytes).toString("base64"),
    key_id,
  };
};

const setSecret = (data) => {

  let url = "PUT " + path_();
  url += "/actions/secrets/" + name;

  return octokit.request(url, {
    data,
  });
};

const bootstrap = async () => {

  try {

    if (name === "") {
      throw new Error("No name was specified!");
    }

    const { key_id, key } = await getPublicKey();

    let data = await createSecret(key_id, key, value);

    if (push_to_org) data["visibility"] = visibility;

    const response = await setSecret(data);

    if (response.status === 201) {
      return "Succesfully created secret " + name + ".";
    }

    if (response.status === 204) {
      return "Succesfully updated secret " + name + " to new value.";
    }

    throw new Error("ERROR: Wrong status was returned: " + response.status);

  } catch (e) {
    core.setFailed(path_() + ": " + e.message);
    console.error(e);
  }
};

bootstrap()
  .then(
    (result) => {
      // eslint-disable-next-line no-console
      if (result != null) {
        console.log(result);
      }
    },
    (err) => {
      // eslint-disable-next-line no-console
      core.setFailed(err.message);
      console.error(err);
    },
  )
  .then(() => {
    process.exit();
  });
