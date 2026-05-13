import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clearHotModules, hotModule, hotReplace } from 'hot-replacer';

// fixtures
class BaseClassA {
    method() {
        return "BaseClassA"
    }
}

class BaseClassB {
    method() {
        return "BaseClassB"
    }
}

function methodA() {
    return "methodA"
}

function methodB() {
    return "methodB"
}

// nested fixtures
class Level1 {
    level2utilA: Level2UtilA
    level2controllerA: Level2ControllerA
    level2loggerA: Level2LoggerA
    constructor() {
        this.level2utilA = new Level2UtilA()
        this.level2controllerA = new Level2ControllerA()
        this.level2loggerA = new Level2LoggerA()
    }

    utilMethod() {
        return this.level2utilA.utilMethod()
    }

    controllerMethod() {
        return this.level2controllerA.controllerMethod()
    }

    loggerMethod() {
        return this.level2loggerA.loggerMethod()
    }
}

class Level2UtilA {
    utilMethod() {
        return "Level2UtilA"
    }
}

class Level2UtilB {
    utilMethod() {
        return "Level2UtilB"
    }
}

class Level2ControllerA {
    level2UtilA: Level2UtilA
    level3ServiceA: Level3ServiceA
    constructor() {
        this.level2UtilA = new Level2UtilA()
        this.level3ServiceA = new Level3ServiceA()
    }

    controllerMethod() {
        return "Level2ControllerA"
    }

    serviceMethod() {
        return this.level3ServiceA.serviceMethod()
    }

    utilMethod() {
        return this.level2UtilA.utilMethod()
    }
}

class Level2ControllerB {
    level2UtilA: Level2UtilA
    level3ServiceA: Level3ServiceA
    constructor() {
        this.level2UtilA = new Level2UtilA()
        this.level3ServiceA = new Level3ServiceA()
    }

    controllerMethod() {
        return "Level2ControllerB"
    }

    serviceMethod() {
        return this.level3ServiceA.serviceMethod()
    }

    utilMethod() {
        return this.level2UtilA.utilMethod()
    }
}

class Level2LoggerA {
    loggerMethod() {
        return "Level2LoggerA"
    }
}

class Level2LoggerB {
    loggerMethod() {
        return "Level2LoggerB"
    }
}

class Level3ServiceA {
    level1LoggerA: Level2LoggerA

    constructor() {
        this.level1LoggerA = new Level2LoggerA()
    }

    serviceMethod() {
        return "Level3ServiceA"
    }

    loggerMethod() {
        return this.level1LoggerA.loggerMethod()
    }
}

class Level3ServiceB {
    level1LoggerA: Level2LoggerA

    constructor() {
        this.level1LoggerA = new Level2LoggerA()
    }

    serviceMethod() {
        return "Level3ServiceB"
    }

    loggerMethod() {
        return this.level1LoggerA.loggerMethod()
    }
}

describe('hotModule', () => {
    beforeEach(clearHotModules)

    describe('class', () => {
        it('should be able to replace base class', () => {
            const HotBaseClassA = hotModule(BaseClassA)
            const instance = new HotBaseClassA()
            assert.equal(instance.method(), "BaseClassA")

            hotReplace(BaseClassA, BaseClassB)
            assert.equal(instance.method(), "BaseClassB")

            assert.ok(instance instanceof BaseClassA)
            assert.ok(!(instance instanceof BaseClassB))
        })

        it('should be able to inherit hot replaced instances', () => {
            const HotBaseClassA = hotModule(BaseClassA)

            class CompositeClass {
                methodable: BaseClassA
                constructor() {
                    this.methodable = new HotBaseClassA()
                }

                makeMethodable() {
                    return new HotBaseClassA()
                }
            }

            const HotCompositeClass = hotModule(CompositeClass)

            const instance = new HotCompositeClass()
            assert.equal(instance.makeMethodable().method(), new BaseClassA().method())
            assert.equal(instance.methodable.method(), new BaseClassA().method())

            hotReplace(BaseClassA, BaseClassB)
            assert.equal(instance.makeMethodable().method(), new BaseClassB().method())
            assert.equal(instance.methodable.method(), new BaseClassB().method())
        })
    })

    describe('function', () => {
        it('should be able to replace function', () => {
            const hotMethodA = hotModule(methodA)
            assert.equal(hotMethodA(), "methodA")

            hotReplace(methodA, methodB)
            assert.equal(hotMethodA(), "methodB")
        })
    })

    describe('object', () => {
        it('should be able to replace object properties', () => {
            const obj = {
                BaseClassA,
                methodA,
            }

            const hotObj = hotModule(obj)

            assert.equal(new hotObj.BaseClassA().method(), "BaseClassA")
            assert.equal(hotObj.methodA(), "methodA")

            hotReplace(BaseClassA, BaseClassB)
            hotReplace(methodA, methodB)

            assert.equal(new hotObj.BaseClassA().method(), "BaseClassB")
            assert.equal(hotObj.methodA(), "methodB")
        })

        it('should be able to replace nested object', () => {
            const innerObj = {
                instance: new BaseClassA(),
                methodA,
            }

            const hotInnerObj = hotModule(innerObj)

            const obj = {
                BaseClassA,
                methodA,
                innerObj: hotInnerObj,
            }

            const hotObj = hotModule(obj)

            assert.equal(hotObj.innerObj.instance.method(), "BaseClassA")
            assert.equal(hotObj.innerObj.methodA(), "methodA")

            hotReplace(BaseClassA, BaseClassB)
            hotReplace(methodA, methodB)

            assert.equal(hotObj.innerObj.instance.method(), "BaseClassB")
            assert.equal(hotObj.innerObj.methodA(), "methodB")
        })

        it('should be able to proxy through `this`', () => {
            const instance = new Level3ServiceA()
            const hotInstance = hotModule(instance)

            assert.equal(hotInstance.loggerMethod(), "Level2LoggerA")

            hotReplace(Level2LoggerA, Level2LoggerB)
            assert.equal(hotInstance.loggerMethod(), "Level2LoggerB")
        })

        it('should be able to replace deeply nested object', () => {
            const level1 = new Level1()
            const hotLevel1 = hotModule(level1)

            assert.equal(hotLevel1.utilMethod(), "Level2UtilA")
            assert.equal(hotLevel1.controllerMethod(), "Level2ControllerA")
            assert.equal(hotLevel1.loggerMethod(), "Level2LoggerA")
            assert.equal(hotLevel1.level2controllerA.controllerMethod(), "Level2ControllerA")
            assert.equal(hotLevel1.level2controllerA.serviceMethod(), "Level3ServiceA")
            assert.equal(hotLevel1.level2controllerA.utilMethod(), "Level2UtilA")
            assert.equal(hotLevel1.level2controllerA.level2UtilA.utilMethod(), "Level2UtilA")
            assert.equal(hotLevel1.level2controllerA.level3ServiceA.serviceMethod(), "Level3ServiceA")
            assert.equal(hotLevel1.level2controllerA.level3ServiceA.loggerMethod(), "Level2LoggerA")
            assert.equal(hotLevel1.level2controllerA.level3ServiceA.level1LoggerA.loggerMethod(), "Level2LoggerA")

            hotReplace(Level2UtilA, Level2UtilB)
            assert.equal(hotLevel1.utilMethod(), "Level2UtilB")
            assert.equal(hotLevel1.level2controllerA.utilMethod(), "Level2UtilB")
            assert.equal(hotLevel1.level2controllerA.level2UtilA.utilMethod(), "Level2UtilB")

            hotReplace(Level2ControllerA, Level2ControllerB)
            assert.equal(hotLevel1.controllerMethod(), "Level2ControllerB")
            assert.equal(hotLevel1.level2controllerA.controllerMethod(), "Level2ControllerB")

            hotReplace(Level2LoggerA, Level2LoggerB)
            assert.equal(hotLevel1.loggerMethod(), "Level2LoggerB")
            assert.equal(hotLevel1.level2controllerA.level3ServiceA.loggerMethod(), "Level2LoggerB")
            assert.equal(hotLevel1.level2controllerA.level3ServiceA.level1LoggerA.loggerMethod(), "Level2LoggerB")

            hotReplace(Level3ServiceA, Level3ServiceB)
            assert.equal(hotLevel1.level2controllerA.serviceMethod(), "Level3ServiceB")
            assert.equal(hotLevel1.level2controllerA.level3ServiceA.serviceMethod(), "Level3ServiceB")
        })

        it('should be able to replace deeply nested object', () => {
            const HotLevel1 = hotModule(Level1)
            const hotLevel1 = new HotLevel1()

            assert.equal(hotLevel1.utilMethod(), "Level2UtilA")
            assert.equal(hotLevel1.controllerMethod(), "Level2ControllerA")
            assert.equal(hotLevel1.loggerMethod(), "Level2LoggerA")
            assert.equal(hotLevel1.level2controllerA.controllerMethod(), "Level2ControllerA")
            assert.equal(hotLevel1.level2controllerA.serviceMethod(), "Level3ServiceA")
            assert.equal(hotLevel1.level2controllerA.utilMethod(), "Level2UtilA")
            assert.equal(hotLevel1.level2controllerA.level2UtilA.utilMethod(), "Level2UtilA")
            assert.equal(hotLevel1.level2controllerA.level3ServiceA.serviceMethod(), "Level3ServiceA")
            assert.equal(hotLevel1.level2controllerA.level3ServiceA.loggerMethod(), "Level2LoggerA")
            assert.equal(hotLevel1.level2controllerA.level3ServiceA.level1LoggerA.loggerMethod(), "Level2LoggerA")

            hotReplace(Level2UtilA, Level2UtilB)
            assert.equal(hotLevel1.utilMethod(), "Level2UtilB")
            assert.equal(hotLevel1.level2controllerA.utilMethod(), "Level2UtilB")
            assert.equal(hotLevel1.level2controllerA.level2UtilA.utilMethod(), "Level2UtilB")

            hotReplace(Level2ControllerA, Level2ControllerB)
            assert.equal(hotLevel1.controllerMethod(), "Level2ControllerB")
            assert.equal(hotLevel1.level2controllerA.controllerMethod(), "Level2ControllerB")

            hotReplace(Level2LoggerA, Level2LoggerB)
            assert.equal(hotLevel1.loggerMethod(), "Level2LoggerB")
            assert.equal(hotLevel1.level2controllerA.level3ServiceA.loggerMethod(), "Level2LoggerB")
            assert.equal(hotLevel1.level2controllerA.level3ServiceA.level1LoggerA.loggerMethod(), "Level2LoggerB")

            hotReplace(Level3ServiceA, Level3ServiceB)
            assert.equal(hotLevel1.level2controllerA.serviceMethod(), "Level3ServiceB")
            assert.equal(hotLevel1.level2controllerA.level3ServiceA.serviceMethod(), "Level3ServiceB")
        })
    })
})