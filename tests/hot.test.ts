import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clearHotModules, hotModule, hotReplace } from '../src/hot.ts';

describe('hotModule', () => {
    beforeEach(clearHotModules)

    describe('class', () => {
        it('should be able to replace base class', () => {
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

            const HotBaseClassA = hotModule(BaseClassA)
            const instance = new HotBaseClassA()
            assert.equal(instance.method(), "BaseClassA")

            hotReplace(BaseClassA, BaseClassB)
            assert.equal(instance.method(), "BaseClassB")

            assert.ok(instance instanceof BaseClassA)
            assert.ok(!(instance instanceof BaseClassB))
        })

        it('should be able to inherit hot replaced instances', () => {
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
            function methodA() {
                return "methodA"
            }
            function methodB() {
                return "methodB"
            }

            const hotMethodA = hotModule(methodA)
            assert.equal(hotMethodA(), "methodA")

            hotReplace(methodA, methodB)
            assert.equal(hotMethodA(), "methodB")
        })
    })

    describe('object', () => {
        it('should be able to replace object properties', () => {
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
    })
})