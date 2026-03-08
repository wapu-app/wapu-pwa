#!/usr/bin/env bash

if [ -z $1 ]
then
  echo "Platform 'int' or 'uat' or 'prod' expected and NOT SUPPLIED."
  echo 'Example: ./set_environment.sh int'
  exit 1;
fi

if [ $1 = 'local' ]
then
    echo "Setting environment to 'local'..."
    cp config/environment/local/local.env.js config/environment/current/index.js
elif [ $1 = 'stg' ]
then
    echo "Setting environment to 'staging'..."
    cp config/environment/staging/stg.env.js config/environment/current/index.js
elif [ $1 = 'qa' ]
then
    echo "Setting environment to 'qa'..."
    cp config/environment/qa/qa.env.js config/environment/current/index.js
elif [ $1 = 'prod' ]
then
    echo "Setting environment to 'prod'..."
    cp config/environment/prod/prod.env.js config/environment/current/index.js
fi


git clean -fd package.json-e