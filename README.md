# AWS Profile Prompt

Allows easy management of AWS Profiles with search.

![Demo](recording.gif)

## Installation

```shell
npm i -g aws-profile-prompt 
```
Alias _awsp by adding the following to your `.bashrc` or `.zshrc`. This **must** be done to ensure the AWS_PROFILE 
environment variable is exported correctly. 

```shell
alias awsp="source _awsp"
```

## Usage

```shell
awsp

# Or, to default the filter (e.g. To list the environments containing "prod"): 
awsp prod
```

## ZSH Prompt

In the recording, my zsh prompt shows the active AWS Profile. My `.zshrc` is as follows:

```shell
function aws_prof {   
  if [ "$AWS_PROFILE"  = '' ]; then
    true
  else
     echo "%{$fg_bold[blue]%}aws:(%{$fg[red]%}$AWS_PROFILE%{$fg_bold[blue]%})%{$reset_color%} "
  fi
}

PROMPT='${ret_status} %{$fg[cyan]%}%c%{$reset_color%} $(aws_prof)$(git_prompt_info)'

```

## Profile Configuration

**Note**: This section is only relevant if you are new to AWS Profiles. 

AWS Profiles are created in `~/.aws/credentials`.

```shell
[a]
aws_access_key_id=XXX
aws_secret_access_key=xxx

[b]
aws_access_key_id=XXX
aws_secret_access_key=xxx
```

I make heavy use of AWS organizations or sub-accounts. For example, AWS account 'a' would have region/environment 
sub-accounts 'a.au.prod' and 'a.fr.prod'. I assume a role to jump from the main account into these sub-accounts. 

In this example, my `~/.aws/credentials` would contain:

```shell
# Profile name
[a.au.prod]

# The role that you are assuming. The role specified when creating the sub-account will work.
role_arn = arn:aws:iam::[sub-account-id]:role/OrganizationAccountAccessRole

# The default region for the profile.
region = ap-southeast-2

# The source profile to use the access keys from.
source_profile = a
```

You can switch between profiles by setting the AWS_PROFILE environment variable to the name of the profile. 

## Using Profiles with the AWS Javascript SDK V3

It is possible to split AWS configuration into 'credentials' and 'config'. 

- `~/.aws/credentials` stores profiles with an access key and secret (e.g. '[a]')
- `~/.aws/config` stores profiles with a source_profile (e.g. '[a.au.prod]')

This works fine with the AWS CLI, but it does not work with V3 of the Javascript SDK right now. All profiles **MUST** 
be defined in `~/.aws/credentials`. Otherwise, the current version of the AWS SDK will fail to find the profile 
(Yes, even if AWS_SDK_LOAD_CONFIG is set).  

This is the primary motivation behind this package. Other profile switches use `~/.aws/config` to source profile 
configuration which make them useless when used alongside the V3 SDK.
