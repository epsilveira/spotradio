import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import fs from 'fs';
import fsPromises from 'fs/promises';
import config from '../../../server/config.js'
import { Service } from '../../../server/service.js'
import TestUtil from '../_util/testUtil.js'
import { join } from 'path'

const {
  dir: {
    publicDirectory
  }
} = config

describe('#Services - test services', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test('#createFileStream - should create a file stream', async () => {
    const service = new Service()
    const mockFileStream = TestUtil.generateReadableStream(['data'])
    const filename = 'file.ext'

    jest.spyOn(
      fs,
      fs.createReadStream.name
    ).mockReturnValue(mockFileStream)

    const res = service.createFileStream(filename)

    expect(fs.createReadStream).toHaveBeenCalledWith(filename)
    expect(res).toStrictEqual(mockFileStream)
  })

  test('#getFileInfo - should return information of a file', async () => {
    const service = new Service()
    const filename = 'file.ext'
    const fileType = '.ext'
    const fullFilePath = join(publicDirectory, filename)

    jest.spyOn(
      fsPromises,
      fsPromises.access.name
    ).mockReturnValue()

    const res = await service.getFileInfo(filename)

    //não precisa testar novamente
    //expect(fsPromises.access).toBeCalledWith(fullFilePath)
    expect(res).toStrictEqual({
      type: fileType,
      name: fullFilePath
    })
  })

  test('#getFileStream - should return a file stream', async () => {
    const service = new Service()
    const filename = 'file.ext'
    const fileType = '.ext'
    const fullFilePath = join(publicDirectory, filename)
    const currentReadable = TestUtil.generateReadableStream(['data'])


    jest.spyOn(
      service,
      service.getFileInfo.name
    ).mockResolvedValue({
      type: fileType,
      name: fullFilePath
    })

    jest.spyOn(
      service,
      service.createFileStream.name
    ).mockReturnValue(currentReadable)

    const res = await service.getFileStream(filename)
    const expectedResult = {
      type: fileType,
      stream: currentReadable
    }
    expect(service.getFileInfo).toHaveBeenCalledWith(filename)
    expect(service.createFileStream).toHaveBeenCalledWith(fullFilePath)
    expect(res).toStrictEqual(expectedResult)
  })

})