# hot-replacer

Replace modules while the node process is still running.

## APIs

### `hotModule`
Defines a module that can be replaced

### `hotReplace`
Replaces the module with a new module

### `clearHotModules`
Resets to the original module

## Example application: Test module replacement

```ts
import { hotModule, hotReplace, clearHotModules } from 'hot-replacer'

describe('ControllerTest', () => {
    const controller = hotModule(new Controller())
    beforeEach(clearHotModules)

    describe('logger methods called', () => {
        // all references to the Logger class only will be replaced with LoggerMock
        beforeEach(() => {
            hotReplace(Logger, LoggerMock)
        })

        it('should log with error', () => {
            controller.method();
            const loggerMock = controller.logger as LoggerMock
            assert.equal(loggerMock.lastCall, "something")
        })
    })

    describe('next test', () => {
        // clearHotModules is called
        // logger is no longer mocked
    })
})
```

## Example application: Live module replacement

This package can be connected to a module hook to replace module in real time for development.

```ts
import { hotModule, hotReplace, clearHotModules } from 'hot-replacer'
import { moduleHook } from 'some-package'
import { fileWatcher } from 'some-package'

moduleHook.onImport('sample-module.ts', (exports) => {
    const hotExports: Record<string, any> = {}
    for(const k in exports) {
        hotExport[k] = hotModule(exports[k])
    }

    fileWatcher('sample-module.ts', async (content) => {
        const newExports = await moduleHook.reloadModule('sample-module.ts')
        for(const k in newExports) {
            if (!hotExports[k]) {
                hotExports[k] = hotModule(newExports[k])
            } else {
                hotReplace(exports[k], newExports[k])
            }
        }

    })

    return hotExports
})
```