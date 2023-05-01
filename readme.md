# Set Secret
[![Release](https://github.com/kroese/set-secret/actions/workflows/build.yml/badge.svg)](https://github.com/kroese/set-secret/actions/workflows/build.yml)
[![Version](https://img.shields.io/github/v/tag/kroese/set-secret?label=version&color=066497)](https://github.com/kroese/set-secret/)

Action to set repository secrets.

## Usage

```YAML
uses: kroese/set-secret@v5
with:
  name: 'MY_SECRET'
  value: 'Lorem ipsun dolor simit'
  token: ${{ secrets.REPO_ACCESS_TOKEN }}
```

## Inputs

### name

**Required** `String` Secret name.

### value

**Required** `String` Secret value to store.

### token

**Required** `String` Repository [Access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)

### owner

**Optional** `String` Owners name.

### repository

**Optional** `String` Repository name.

### org

**Optional** `Boolean` Indicates the repo is an [organization](https://docs.github.com/en/github/setting-up-and-managing-organizations-and-teams/about-organizations).
