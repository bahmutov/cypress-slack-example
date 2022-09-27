const { WebClient } = require('@slack/web-api')

const notifyOnTestFailures = {
  // for the spec, list the channel and any specific users to notify
  // separated by spaces
  'adding-specs.ts': '#todomvc-adding-items-tests',
  'import-fixture-spec.ts': '#todomvc-fixtures-tests @gleb.bahmutov',
  'routing-spec.ts': '#todomvc-routing-tests',
  // TODO: add support for finding notifications by test tags
}

function findChannelToNotify(failedSpecRelativeFilename) {
  const spec = Object.keys(notifyOnTestFailures).find((ch) => {
    return failedSpecRelativeFilename.endsWith(ch)
  })
  if (!spec) {
    return
  }
  return notifyOnTestFailures[spec]
}

// s could be something like "#channel @user1 @user2"
function getChannelAndPeople(s) {
  const parts = s.split(' ')
  const channel = parts.find((s) => s.startsWith('#'))
  const people = parts.filter((s) => s.startsWith('@'))
  return { channel, people }
}

const getTestPluralForm = (n) => (n === 1 ? 'test' : 'tests')

// looking up user ids from user aliases
let usersStore

export async function postCypressSlackResult(spec, failedN: number, runInfo) {
  if (!process.env.SLACK_TOKEN) {
    return
  }

  // Read a token from the environment variables
  // To get a token, read https://slack.dev/node-slack-sdk/getting-started
  // added a "bot token scope" "chat:write", "users:read"
  const token = process.env.SLACK_TOKEN

  // Initialize
  const web = new WebClient(token)

  // note: you need to invite the app to each channel
  // before it can post messages to that channel
  const notify = findChannelToNotify(spec.relative)
  const { channel, people } = getChannelAndPeople(notify)
  if (channel) {
    console.error('need to notify channel "%s"', channel)
    let text = `🚨 ${failedN} Cypress ${getTestPluralForm(
      failedN,
    )} failed in spec *${spec.relative}*`
    if (runInfo.runDashboardUrl) {
      // since we deal with the failed specs
      // point the users to the failures right away
      const overviewFailedUrl =
        runInfo.runDashboardUrl + '/overview?reviewViewBy=FAILED'
      text += `\nCypress Dashboard URL: ${overviewFailedUrl}`
    }
    if (runInfo.runDashboardTag) {
      text += `\nRun tags: ${runInfo.runDashboardTag
        .map((s) => '*' + s + '*')
        .join(', ')}`
    }
    if (people && people.length) {
      if (!usersStore) {
        usersStore = {}
        try {
          const userResult = await web.users.list()
          userResult.members.forEach((u) => {
            // console.log(u)
            usersStore[u.name] = u.id
          })
        } catch (e) {
          console.error('Could not fetch the users list')
          console.error(
            'Perhaps the app does not have "users:read" scope permission',
          )
        }
      }
      // https://api.slack.com/reference/surfaces/formatting#mentioning-users
      const userIds = people
        .map((username) => {
          // Slack keeps internal names without '@' symbol
          if (username.startsWith('@')) {
            username = username.substr(1)
          }
          const userId = usersStore[username]
          if (!userId) {
            console.error('Cannot find Slack user id for user "%s"', username)
          }
          return userId
        })
        .filter(Boolean)
        .map((id) => `<@${id}>`)
      if (userIds.length) {
        text += `\nPlease investigate the failures ${userIds.join(', ')}`
      }
    }

    const result = await web.chat.postMessage({
      text,
      channel,
    })
    if (result.ok) {
      console.log('posted message to channel "%s"', channel)
    } else {
      console.error('could not post the test results to "%s"', channel)
      console.error(result)
    }
  } else {
    console.error('no need to notify')
  }
}
