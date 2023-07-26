const github = require("@actions/github");
import * as core from '@unlike/github-actions-core'

const name = core.getInput("name");
const value = core.getInput("value");
const token = core.getInput("token");

const sodium = require('tweetsodium')

const { Octokit } = require("@octokit/core");
const octokit = new Octokit({ auth: token })

const context = github.context;
const repoName = context.payload.repository.name;
const ownerName = context.payload.repository.owner.login;

let repository = core.getInput("repository");
if(repository === 'false'){
  repository = repoName;
}

let owner = core.getInput("owner");
if(owner === 'false'){
  owner = ownerName;
}

let push_to_org = (core.getInput("org") !== 'false');

function get_() {

  if(push_to_org) {
    return '/orgs/' + owner;
  }
  else {
    if(repository.includes("/"))
    {
       return '/repos/' + repository;
    }
    return '/repos/' + owner + '/' + repository;
  }
}

const getPublicKey = async() => {

  let url = "GET "
  url += get_()
  url += "/actions/secrets/public-key"

  let { data } = await octokit.request(url)

  return data;
}

const createSecret = async(key_id, key, secret) => {

  const messageBytes = Buffer.from(secret)
  const keyBytes = Buffer.from(key, 'base64')
  const encryptedBytes = sodium.seal(messageBytes, keyBytes)

  return {
    encrypted_value: Buffer.from(encryptedBytes).toString('base64'),
    key_id
  }

}

const setSecret = (data) => {

  let url = 'PUT '
  url += get_()
  url += '/actions/secrets/' + name

  return octokit.request(url, {
    data
  })

}

const bootstrap = async () => {
  
  try {
    
    const {key_id, key} = await getPublicKey()

    let data = await createSecret(key_id, key, value)

    if(push_to_org){
      data['visibility'] = 'all'
    }

    const response = await setSecret(data)

    if(response.status === 201) {
      return "Succesfully created secret " + name
    }
    
    if(response.status === 204) {
      return "Succesfully updated secret " + name
    }
    
    throw new Error("ERROR: Wrong status was returned: " + response.status)

  }catch (e) {
    core.setFailed(get_() + ": " + e.message);
    console.error(e)
  }
}

bootstrap()
  .then(
    result => {
      // eslint-disable-next-line no-console
      if(result != null) {
        console.log(result);
      }
    },
    err => {
      // eslint-disable-next-line no-console
      core.setFailed(err.message);
      console.error(err)
    }
  )
  .then(() => {
    process.exit();
  });
