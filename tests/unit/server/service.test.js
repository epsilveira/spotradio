import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import fs from 'fs'
import fsPromises from 'fs/promises'
import config from '../../../server/config.js'
import { Service } from '../../../server/service.js'
import TestUtil from '../_util/testUtil.js'
import { join } from 'path'
import childProcess from 'child_process'
import stream from 'stream'
import streamAsync from 'stream/promises'

const {
  PassThrough,
  Writable
} = stream
import Throttle from 'throttle'
import { stdin, stdout } from 'process'

const {
  dir: {
    fxDirectory,
    publicDirectory
  },
  constants: {
    fallbackBitRate,
    bitRateDivisor
  }
} = config

describe('#Services - test suite for core processing', () => {
  const getSpawnResponse = ({
    stdout = '',
    stderr = '',
    stdin = () => { }
  }) => ({
    stdout: TestUtil.generateReadableStream([stdout]),
    stderr: TestUtil.generateReadableStream([stderr]),
    stdin: TestUtil.generateWritableStream(stdin)
  })

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test('#createFileStream - should create a file stream', () => {
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

  test('#removeClientStream', () => {
    const service = new Service()
    jest.spyOn(
      service.clientStreams,
      service.clientStreams.delete.name
    ).mockReturnValue()
    const mockId = '1'
    service.removeClientStream(mockId)

    expect(service.clientStreams.delete).toHaveBeenCalledWith(mockId)
  })

  test('#createClientStream', () => {
    const service = new Service()
    jest.spyOn(
      service.clientStreams,
      service.clientStreams.set.name
    ).mockReturnValue()
    const {
      id,
      clientStream
    } = service.createClientStream()

    expect(id.length).toBeGreaterThan(0)
    expect(clientStream).toBeInstanceOf(PassThrough)
    expect(service.clientStreams.set).toHaveBeenCalledWith(id, clientStream)
  })

  test('#stopStreamming - existing throttleTransform', () => {
    const service = new Service()
    service.throttleTransform = new Throttle(1)
    jest.spyOn(
      service.throttleTransform,
      "end",
    ).mockReturnValue()

    service.stopStreamming()

    expect(service.throttleTransform.end).toHaveBeenCalled()
  })

  test('#stopStreamming - non existing throttleTransform', () => {
    const service = new Service()
    expect(() => service.stopStreamming).not.toThrow()
  })

  test('broadCast = it should write only for active client streams', () => {
    const service = new Service()
    const onData = jest.fn()
    const client1 = TestUtil.generateWritableStream(onData)
    const client2 = TestUtil.generateWritableStream(onData)

    jest.spyOn(
      service.clientStreams,
      service.clientStreams.delete.name
    )

    service.clientStreams.set('1', client1)
    service.clientStreams.set('2', client2)
    client2.end()

    const writable = service.broadCast()
    //vai enviar para o client1 somente
    writable.write('Teste')

    expect(writable).toBeInstanceOf(Writable)
    expect(service.clientStreams.delete).toHaveBeenCalled()
    expect(onData).toHaveBeenCalledTimes(1)
  })

  test('#getBitRate - it should return the bitRate as string', async () => {
    const song = 'mySong'
    const service = new Service()

    const spawnResponse = getSpawnResponse({
      stdout: '   1k   '
    })
    jest.spyOn(
      service,
      service._executeSoxCommand.name
    ).mockReturnValue(spawnResponse)

    const bitRatePromise = service.getBitRate(song)

    const result = await bitRatePromise
    expect(result).toStrictEqual('1000')
    expect(service._executeSoxCommand).toHaveBeenCalledWith(['--i', '-B', song])
  })

  test('#getBitRate - when an error ocurr it should get the fallbackBitRate', async () => {
    const song = 'mySong'
    const service = new Service()

    const spawnResponse = getSpawnResponse({
      stderr: 'error!'
    })
    jest.spyOn(
      service,
      service._executeSoxCommand.name
    ).mockReturnValue(spawnResponse)

    const bitRatePromise = service.getBitRate(song)

    const result = await bitRatePromise
    expect(result).toStrictEqual(fallbackBitRate)
    expect(service._executeSoxCommand).toHaveBeenCalledWith(['--i', '-B', song])
  })

  test('#_executeSoxCommand - it should call the sox command', async () => {
    const service = new Service()
    const spawnResponse = getSpawnResponse({
      stdout: '1k'
    })
    jest.spyOn(
      childProcess,
      childProcess.spawn.name
    ).mockReturnValue(spawnResponse)

    const args = ['myArgs']
    const result = service._executeSoxCommand(args)
    expect(childProcess.spawn).toHaveBeenCalledWith('sox', args)
    expect(result).toStrictEqual(spawnResponse)
  })

  test('#startStreaming - it should call the sox command', async () => {
    const currentSong = 'mySong.mp3'
    const service = new Service()
    service.currentSong = currentSong
    const currentReadable = TestUtil.generateReadableStream(['data'])
    const expectedResult = 'ok'
    const writableBroadCaster = TestUtil.generateWritableStream(() => { })

    jest.spyOn(
      service,
      service.getBitRate.name
    ).mockResolvedValue(fallbackBitRate)

    jest.spyOn(
      streamAsync,
      streamAsync.pipeline.name
    ).mockResolvedValue(expectedResult)

    jest.spyOn(
      fs,
      fs.createReadStream.name
    ).mockReturnValue(currentReadable)

    jest.spyOn(
      service,
      service.broadCast.name
    ).mockReturnValue(writableBroadCaster)

    const expectedThrottle = fallbackBitRate / bitRateDivisor
    const result = await service.startStreamming()

    expect(service.currentBitRate).toEqual(expectedThrottle)
    expect(result).toEqual(expectedResult)
    expect(service.getBitRate).toHaveBeenCalledWith(currentSong)
    expect(fs.createReadStream).toHaveBeenCalledWith(currentSong)
    expect(streamAsync.pipeline).toHaveBeenCalledWith(
      currentReadable,
      service.throttleTransform,
      service.broadCast()
    )
  })

})