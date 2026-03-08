# Initial Deployment
This document follows the process to create a Front End environment.

With the Front End we use AWS Amplify, is a service that takes the React/NextJs code, compile it, and store it in a S3 bucket. Once is compiled and stored, puts it behind a CDN and provide an automated URL, usually `<app name>.<app id>.amplifyapp.com` 

### Amplify webapp creation

- Login with the AWS account where you want to create the instance
- Browse the services and choose `Amplify`
- Select the option `Host web app`
- Choose the name of the new webapp
- Connect it to the repository
  - You need to have admin permissions
- Select the branch that will have the environment code.
- Check the option `Connecting to a monorepo? Pick a folder` and pick the root folder of the React/NextJs project.
  - current folder: `Survivors`
- Confirm the building script
  - You probably need to add the command to select the environment `npm run env:<env>`
  - Also you'll want to add an npm install before it builds
- Add the environment variables needed
  - Please, check the `survivors/README.md` file for this.
- After that, the process to compile and deploy will start. 
- Update the deployment script:
  - Add the command to install the dependencies with `npm install` in the prebuild section.
  - Also you need to add the command to point the environment with `npm run env:<env>` in the build section.
- Check the type of project. Since Amplify decides the type of project according to the folder, it could be wrong.
- Inside `App Settings` > `General` you can see the Platform should be `WEB_COMPUTE`
  - To update it, access it to AWS CLI inside amplify and run the command tou update platform
  - `aws amplify update-app --app-id <APP_ID> --platform WEB_COMPUTE`
- Inside `App Settings` > `General` you can see the `Framework` should be `Next.js - SSR`
  - To update it, access it to AWS CLI inside amplify and run the command to update framework
  - `aws amplify update-branch --app-id <APP_ID> --branch-name <BRANCH_NAME> --framework 'Next.js - SSR'`
- Once is deployed for the first time, you can find the public url in the dashboard of app.
- By default, Amplify sets a Continuous Deployment, so every time that new code is commited, it will build and deploy the new version.

### Troubleshooting

- If the build failed, download the logs of the build and check if the error is logged. You can check out to the branch and build in your local to try to replicate the error.
## Add Custom Domain
### PART 1 - Add a custom domain in Amplify (FE) settings:
- Sign in to the AWS Management Console and open the Amplify console.
- Choose your app that you want to add a custom domain to.
- In the navigation pane, choose App Settings, Domain management.
- On the Domain management page, choose Add domain.
- For Domain, enter the name of your root domain, and then choose Configure domain.
By default, Amplify automatically creates two subdomain entries for your domain. For example, you will see the subdomains https://www.example.com and https://example.com
- Clic on "Exclude root" since we are using that one for the discovery/landing page.
- Replace the "www" by the subdomain you want to use (ej. put "qa" to have a "qa.cryptopagos.xyz", remember it's going to be the frontend site)
- Select the branch you will be using (ej. for a QA env you will use the qa branch) and clic SAVE
- On the Actions menu, choose View DNS records. Use the DNS records displayed in the Amplify console to update your DNS records with your DNS provider. (it should be something like "d3k6y6qsk9a798.cloudfront.net")
### PART 2 - Config the custom domain in the DNS provider
- Log in to cdmon.com
- Look for the cryptopagos.xyz record and clic into DNS
- Clic in NEW RECORD and then select the type "CNAME"
- Select "a specific subdomain" and write the subdomain (ej. "qa")
- In destiny address put the URL Amplify provided (ej. "d3k6y6qsk9a798.cloudfront.net")
- Save it, and wait 10 mins to let it propagate.
