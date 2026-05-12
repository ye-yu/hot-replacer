import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hotModule, hotReplace } from '../src/hot.ts';

describe('hotModule', () => {
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
            assert(instance.method(), "BaseClassA")

            hotReplace(BaseClassA, BaseClassB)
            assert(instance.method(), "BaseClassB")

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
            assert(instance.makeMethodable().method(), new BaseClassA().method())
            assert(instance.methodable.method(), new BaseClassA().method())

            hotReplace(BaseClassA, BaseClassB)
            assert(instance.makeMethodable().method(), new BaseClassB().method())
            assert(instance.methodable.method(), new BaseClassB().method())
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
            assert(hotMethodA(), "methodA")

            hotReplace(methodA, methodB)
            assert(hotMethodA(), "methodB")
        })
    })
})