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

  test('#createClientStream', async () => {
    const mockStream = TestUtil.generateReadableStream(['test'])
    const mockID = '1'
    jest.spyOn(
      Service.prototype,
      Service.prototype.createClientStream.name
    ).mockReturnValue({
      id: mockID,
      clientStream: mockStream
    })

    jest.spyOn(
      Service.prototype,
      Service.prototype.removeClientStream.name
    ).mockReturnValue()

    const controller = new Controller()
    const {
      stream,
      onClose
    } = controller.createClientStream()

    onClose()

    expect(stream).toStrictEqual(mockStream)
    expect(Service.prototype.removeClientStream).toHaveBeenCalledWith(mockID)
    expect(Service.prototype.createClientStream).toHaveBeenCalled()
  })

  describe('handleCommand', () => {

    test('command stop', async () => {
      jest.spyOn(
        Service.prototype,
        Service.prototype.stopStreamming.name
      ).mockResolvedValue()

      const controller = new Controller()
      const data = {
        command: '    stop    ' // espaços porque usamos o tolower e o include, então já testa se reconhece
      }
      const result = await controller.handleCommand(data)
      expect(result).toStrictEqual({
        result: 'ok'
      })
      expect(Service.prototype.stopStreamming).toHaveBeenCalled()
    })

    test('command start', async () => {
      jest.spyOn(
        Service.prototype,
        Service.prototype.startStreamming.name
      ).mockResolvedValue()

      const controller = new Controller()
      const data = {
        command: '    START    ' // espaços e maiúscula porque usamos o tolower e o include, então já testa se reconhece
      }
      const result = await controller.handleCommand(data)
      expect(result).toStrictEqual({
        result: 'ok'
      })
      expect(Service.prototype.startStreamming).toHaveBeenCalled()
    })

    test('non existing command', async () => {
      jest.spyOn(
        Service.prototype,
        Service.prototype.startStreamming.name
      ).mockResolvedValue()

      const controller = new Controller()
      const data = {
        command: '    NON EXISTING    '
      }
      const result = await controller.handleCommand(data)
      expect(result).not.toStrictEqual({
        result: 'ok'
      })
      expect(Service.prototype.startStreamming).not.toHaveBeenCalled()
    })
  })
})