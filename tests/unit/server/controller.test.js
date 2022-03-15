import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { Controller } from '../../../server/controller.js'
import { Service } from '../../../server/service.js'

describe('#Controller - test site for stream file', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test('controller.getFileStream method should call service.getFileStream method', async () => {
    const controller = new Controller()
    const filename = '/index.html'

    jest.spyOn(
      Service.prototype,
      Service.prototype.getFileStream.name
    ).mockResolvedValue()

    await controller.getFileStream(filename)

    expect(Service.prototype.getFileStream).toHaveBeenCalledWith(filename)
  })
})