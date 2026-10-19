# Set up Instagram

About 15 minutes. You do this once; after that the token renews itself.

Meta changes its developer dashboard often, so button names may differ slightly from the steps below. The order stays the same.

## Before you start

- **A professional account.** The Instagram account must be a Business or Creator account. In the Instagram app: **Settings and activity > Account type and tools > Switch to professional account**. It's free, and you can switch back.
- **A public account.** Private accounts can't be used.
- **A Meta developer account.** Go to [developers.facebook.com](https://developers.facebook.com), log in with a Facebook account, and finish the developer registration. Use a login your organization can keep access to, not a personal account someone may leave with.

## Create the app

1. On [developers.facebook.com](https://developers.facebook.com), open **My Apps > Create App**.
2. If asked to connect a business portfolio, you can skip it.
3. **Use case:** choose **Other**, then **Next**.
4. **App type:** choose **Business**, then **Next**.
5. **App name:** anything, such as "Website feed". Add a contact email. Create the app.
6. On the app's dashboard, find **Instagram** and click **Set up**.
7. In the left menu, open **Instagram > API setup with Instagram login**. Don't use "API setup with Facebook login", which is for accounts linked through a Facebook Page.

## Generate the token

1. In **Generate access tokens**, click **Add account**.
2. Log in with the **Instagram account whose posts you want to show**, and approve.
3. Click **Generate token** next to the account. Log in again if asked.
4. Copy the token right away. The dashboard won't show it again.
5. Save it as the `IG_ACCESS_TOKEN` secret in your repository: [Add the Instagram token](setup-github.md#add-the-instagram-token).

The token lasts 60 days, and the workflow renews it every week once you [add `GH_PAT`](setup-github.md#automatic-token-renewal).

## Things you can skip

- **App Review, business verification, and publishing the app.** The app only reads the account that added itself, so it can stay in Development mode.
- **Webhooks, business login settings, and redirect URLs.** Those are for apps other people log in to.
- **The app secret.** This project never uses it. Don't store it anywhere.

## Keep permissions minimal

The feed needs one permission: `instagram_business_basic`, which reads the profile and posts. If the dashboard lists others for this use case (messages, comments, publishing), remove them before you generate the token. A token with fewer permissions does less damage if it leaks.

## If a token leaks

If a token ends up in a commit, an issue, a screenshot, or a chat:

1. Cancel it. In the Instagram app, go to **Settings and activity > Website permissions > Apps and websites** (the path varies by app version), and remove your app. That cancels every token the app issued for this account.
2. Add the account again and generate a new token, as above.
3. Replace the `IG_ACCESS_TOKEN` secret in your repository.
4. If the token was committed, deleting the file isn't enough, because it stays in the history. Cancelling the token makes the old value useless.

## When you need a new token

You only need to repeat [Generate the token](#generate-the-token) if:

- the workflow fails with "The Instagram token is missing, invalid, or expired"
- the account's password changes, or someone removes the app from the account
- the token went more than 60 days without a renewal (for example, if `GH_PAT` expired)
