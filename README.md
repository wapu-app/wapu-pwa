This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Set your local environment

First, run the development server:

```bash
npm install
npm i sass
npm install web3
npm run env:qa

npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Handling Environments

If you want to change the environment, you have to run `npm run env:<environment> ` on the console. The script list is in the package.json

The available environments are:

-   local
-   qa
-   stg
-   prod

## Deploy

We are currently using AWS Amplify to host the Front End. It builds the application, stores the result in a S3 bucket and put it behind a CDN, giving you an automatic generated url. If you're looking how to run the initial deploy, got to `survivors/initial_deploy.md`

Amplify sets a Continuous Deployment process as default, so the deployment is triggered with every commit.

-   If you're deploying to QA, you need to merge `develop` into `qa`, the deployment is triggered automatically.
-   If you're deploying to Staging, you need to merge `qa` into `staging`, the deployment is triggered automatically.
-   If you're deploying to prod, you need to create a branch release name `release-<version>` from `staging`, and then merged it into `main`, this can include all the changes from `staging`, usually all the sprint's work, or a hotfix.
