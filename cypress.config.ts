import { defineConfig } from 'cypress'
import { getTestNames, setEffectiveTags } from 'find-test-names'
import { readFileSync } from 'fs'
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
          // console.log(config)
          // console.log(results)
          if (results.error || results.stats.failures) {
            console.log(spec)
            console.error('Test failures in %s', spec.relative)
            await postCypressSlackResult(spec, {
              runDashboardUrl,
              runDashboardTag,
            })
            console.log('after postCypressSlackResult')
          }
          // if (!results.error) {
          //   console.log(spec)
          //   console.log(JSON.stringify(results.tests))
          //   const specSource = readFileSync(spec.absolute, 'utf8')
          //   const specInfo = getTestNames(specSource, true)
          //   setEffectiveTags(specInfo.structure)
          //   console.log(specInfo.structure[0].suites[0])
          // }
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
