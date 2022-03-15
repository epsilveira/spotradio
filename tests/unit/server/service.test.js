import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import fs from 'fs';
import fsPromises from 'fs/promises';
import config from '../../../server/config.js'
import { Controller } from '../../../server/controller.js'
import { handler } from '../../../server/routes.js'
import { Service } from '../../../server/service.js'
import TestUtil from '../_util/testUtil.js'
import { join } from 'path'

const {
  pages,
  location,
  constants: {
    CONTENT_TYPE
  },
  dir: {
    publicDirectory
  }
} = config

describe('#Services - test services', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test('createFileStream - should create a file stream', async () => {
    const service = new Service()
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      fs,
      fs.createReadStream.name
    ).mockReturnValue(mockFileStream)

    const res = service.createFileStream('file.ext')

    expect(fs.createReadStream).toBeCalledWith('file.ext')
    expect(res).toBe(mockFileStream)
  })

  test('getFileInfo - should return information of a file', async () => {
    const service = new Service()
    const filename = 'file.ext'
    const fileType = '.ext'
    const fullFilePath = join(publicDirectory, filename)

    jest.spyOn(
      fsPromises,
      fsPromises.access.name
    ).mockReturnValue()

    const res = await service.getFileInfo(filename)

    expect(fsPromises.access).toBeCalledWith(fullFilePath)
    expect(res).toEqual({
      type: fileType,
      name: fullFilePath
    })
  })

  test('getFileStream - should return a file stream', async () => {
    const service = new Service()
    const filename = 'file.ext'
    const fileType = '.ext'
    const fullFilePath = join(publicDirectory, filename)
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      service,
      'getFileInfo'
    ).mockResolvedValue({
      name: fullFilePath,
      type: fileType
    })

    jest.spyOn(
      service,
      service.createFileStream.name
    ).mockImplementation(() => mockFileStream)

    const res = await service.getFileStream(filename)

    expect(service.getFileInfo).toBeCalledWith(filename)
    expect(service.createFileStream).toBeCalledWith(fullFilePath)
    expect(res).toEqual({
      stream: mockFileStream,
      type: fileType
    })
  })

})