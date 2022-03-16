import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { Controller } from '../../../server/controller.js'
import { Service } from '../../../server/service.js'
import TestUtil from '../_util/testUtil.js'

describe('#Controller - test site for stream file', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  // Implementação antiga
  // test('#getFileStream method should call service.getFileStream method', async () => {
  //   const controller = new Controller()
  //   const filename = '/index.html'

  //   jest.spyOn(
  //     Service.prototype,
  //     Service.prototype.getFileStream.name
  //   ).mockResolvedValue()

  //   await controller.getFileStream(filename)

  //   expect(Service.prototype.getFileStream).toHaveBeenCalledWith(filename)
  // })

  // Implementação nova (correção)

  test('#getFileStream method should call service.getFileStream method', async () => {
    const controller = new Controller()
    const mockFilename = 'test.html'
    const mockType = '.html'
    const mockStream = TestUtil.generateReadableStream(['test'])

    jest.spyOn(
      Service.prototype,
      Service.prototype.getFileStream.name
    ).mockResolvedValue({
      stream: mockStream,
      type: mockType
    })

    const { stream, type } = await controller.getFileStream(mockFilename)

    expect(stream).toStrictEqual(mockStream)
    expect(type).toStrictEqual(mockType)
  })
})