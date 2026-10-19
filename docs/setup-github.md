# Set up GitHub

About 10 minutes. You can do this before you have an Instagram token.

## Create your repository

1. On this project's GitHub page, click **Use this template > Create a new repository**.
2. Pick a name. It becomes part of your feed address: `https://YOUR-USER.github.io/YOUR-REPO/`.
3. Choose **Public**. GitHub Pages is free for public repositories. Your token is stored as an encrypted secret, never in a file, so a public repository doesn't expose it. If you have a paid GitHub plan, private works too.
4. Click **Create repository**.

Use the template rather than a fork. Forks pause scheduled workflows by default, and GitHub always shows them as copies of this project.

## Turn on GitHub Pages

1. **Settings > Pages**.
2. Under **Build and deployment > Source**, choose **GitHub Actions**.

## Publish the sample feed

1. **Actions** tab. If GitHub asks, click **I understand my workflows, go ahead and enable them**.
2. Click **Update feed** in the left list, then **Run workflow > Run workflow**.
3. When the run shows a green check, open `https://YOUR-USER.github.io/YOUR-REPO/`. You should see 6 sample posts.

Your feed address is `https://YOUR-USER.github.io/YOUR-REPO/feed.json`. You'll use it when you [set up your website](setup-website.md).

If the run fails at the Pages step with a permissions error, go to **Settings > Actions > General > Workflow permissions**, choose **Read and write permissions**, save, and run it again. In an organization account, an owner may need to allow this first.

## Add the Instagram token

After you [get a token from Instagram](setup-instagram.md):

1. **Settings > Secrets and variables > Actions > New repository secret**.
2. Name: `IG_ACCESS_TOKEN`. Secret: paste the token. Click **Add secret**.
3. **Actions > Update feed > Run workflow.** Your posts replace the samples within a couple of minutes.

From now on the workflow checks for new posts every 6 hours.

## Automatic token renewal

Instagram tokens last 60 days. Every Monday the workflow asks Instagram to extend the token. When Instagram hands back a new token, the workflow saves it into the `IG_ACCESS_TOKEN` secret. GitHub's built-in workflow token isn't allowed to change secrets, so you give the workflow a personal access token for that one job.

1. Click your profile picture > **Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token**.
2. **Token name:** something like `feed token renewal`.
3. **Expiration:** the longest your account allows. Put the date on your calendar.
4. **Resource owner:** the account that owns the feed repository.
5. **Repository access:** **Only select repositories**, then pick your feed repository.
6. **Permissions > Repository permissions > Secrets:** **Read and write**. Leave everything else at **No access**.
7. **Generate token** and copy it.
8. In the feed repository: **Settings > Secrets and variables > Actions > New repository secret**. Name: `GH_PAT`. Paste the token.

If your repository belongs to an organization, an owner may need to approve the token before it works.

### Test the renewal

Instagram won't renew a token less than 24 hours old, so wait a day after adding `IG_ACCESS_TOKEN`. Then:

**Actions > Update feed > Run workflow**, tick **Also refresh the Instagram token now**, and run it. The log should say the token was refreshed and saved.

## What runs and when

| When | What happens |
| --- | --- |
| Every 6 hours | Checks Instagram for new posts. Commits and publishes only if something changed. |
| Mondays | Also renews the Instagram token and commits a small `last-refresh.txt` file. GitHub pauses scheduled workflows in repositories with no activity for 60 days, and this commit prevents that. |
| You edit `feed.config.json` | Rebuilds the feed with your new featured posts. |
| You click **Run workflow** | Runs right away. |
| No `IG_ACCESS_TOKEN` yet | Scheduled runs skip everything. Manual runs publish the sample feed. |

GitHub emails you when a run fails. See [Troubleshooting](troubleshooting.md) for each error.
