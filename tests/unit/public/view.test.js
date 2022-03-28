import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { JSDOM } from 'jsdom'
import View from '../../../public/controller/js/view.js'

describe('#View - test suite for presentation layer', () => {
  const dom = new JSDOM()
  global.document = dom.window.document
  global.window = dom.window

  function makeBtnElement({
    text,
    classList

  } = {
      text: '',
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
      }
    }) {
    return {
      onclick: jest.fn(),
      classList,
      innerText: text
    }

  }

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()

    jest.spyOn(
      document,
      "getElementById"
    ).mockReturnValue(makeBtnElement()) //o getElementById retorna apenas um elemento

  })

  test('#changeCommandBtnsVisibility - given hide=true it should add unassigned class and reset onclick', () => {
    const view = new View()
    const btn = makeBtnElement()
    jest.spyOn(
      document,
      "querySelectorAll"
    ).mockReturnValue([btn]) //o querySelectorAll retorna um array

    view.changeCommandBtnsVisibility()
    expect(btn.classList.add).toHaveBeenCalledWith('unassigned')
    expect(btn.onclick.name).toStrictEqual('onClickReset')
    expect(() => btn.onclick()).not.toThrow()
  })
  test('#changeCommandBtnsVisibility - given hide=false it should remove unassigned class and reset onclick', () => {
    const view = new View()
    const btn = makeBtnElement()
    jest.spyOn(
      document,
      "querySelectorAll"
    ).mockReturnValue([btn]) //o querySelectorAll retorna um array

    view.changeCommandBtnsVisibility(false)
    expect(btn.classList.add).not.toHaveBeenCalled()
    expect(btn.classList.remove).toHaveBeenCalledWith('unassigned')
    expect(btn.onclick.name).toStrictEqual('onClickReset')
    expect(() => btn.onclick()).not.toThrow()
  })
  test('#onLoad', () => {
    const view = new View()
    jest.spyOn(
      view,
      view.changeCommandBtnsVisibility.name
    ).mockReturnValue()

    view.onLoad()

    expect(view.changeCommandBtnsVisibility).toHaveBeenCalled()
  })
})