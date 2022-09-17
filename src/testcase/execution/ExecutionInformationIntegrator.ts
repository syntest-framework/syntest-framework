import { JavaScriptTestCase } from "../JavaScriptTestCase";
import { Statement } from "../statements/Statement";


export default class ExecutionInformationIntegrator {
  processSuccess(testCase: JavaScriptTestCase, testResult: any) {

    // const queue: Statement[] = [testCase.root]
    //
    // while (queue.length) {
    //   const root = queue.pop()
    //   const children = root.getChildren()
    //
    //   for (const child of children) {
    //     child.identifierDescription.typeProbabilityMap.addExecutionScore(child.type, 1)
    //     queue.push(child)
    //   }
    // }
  }

  processError(testCase: JavaScriptTestCase, testResult: any) {

    // console.log(testResult.err.name)
    // console.log(testResult.err.message)
    // console.log()

    // if (!testResult.err.stack.split('\n')[2].includes('tempTest.spec.js')) {
    //   // console.log(testResult.err)
    //   // console.log()
    //   return
    // }
    //
    // if (testResult.err.name !== 'TypeError') {
    //   return
    // }

    // console.log(testResult.err)

    const queue: Statement[] = [testCase.root]

    while (queue.length) {
      const root = queue.pop()
      const children = root.getChildren()

      for (const child of children) {
        if (testResult.err.message.includes(child.identifierDescription.name)) {
          // console.log(child.identifierDescription.typeProbabilityMap)
          // console.log(testResult.err)
          child.identifierDescription.typeProbabilityMap.addExecutionScore(child.type, -1)
        }
        queue.push(child)
      }
    }
  }
}
