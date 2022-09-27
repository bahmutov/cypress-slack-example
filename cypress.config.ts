import { defineConfig } from 'cypress'
import { postCypressSlackResult } from './cypress-slack-notify'

export default defineConfig({
  projectId: '9wrvf1',
  e2e: {
    video: false,
    env: {
      grepFilterSpecs: true,
      grepOmitFiltered: true,
    },
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      // https://github.com/cypress-io/cypress-grep
      require('cypress-grep/src/plugin')(on, config)

      on('task', {
        getNumber() {
          return 42
        },
      })

      let runDashboardTag
      let runDashboardUrl

      on('before:run', (runDetails) => {
        runDashboardUrl = runDetails.runUrl
        runDashboardTag = runDetails.tag
      })

      on('after:spec', async (spec, results) => {
        try {
          // error - unexpected crash, the tests could not run
          if (results.error || results.stats.failures) {
            console.error('Test failures in %s', spec.relative)
            // TODO handle both an unexpected error
            // and the specific number of failed tests
            await postCypressSlackResult(spec, results.stats.failures, {
              runDashboardUrl,
              runDashboardTag,
            })
            console.log('after postCypressSlackResult')
          }
        } catch (e) {
          console.error('problem after spec')
          console.error(e)
        }
      })

      // make sure to return the config object
      // as it might have been modified by the plugin
      return config
    },
    baseUrl: 'http://localhost:8888',
    specPattern: 'cypress/e2e/**/*spec.{js,ts}',
  },
})
