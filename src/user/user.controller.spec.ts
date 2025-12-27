import { BadRequestException, HttpException } from '@nestjs/common';
import { UserController } from './user.controller';

describe('UserController', () => {
  let controller: UserController;
  const mockUserService: any = {
    updateUser: jest.fn(),
    signInUser: jest.fn(),
  };

  beforeEach(() => {
    mockUserService.updateUser.mockReset();
    mockUserService.signInUser.mockReset();

    controller = new UserController(mockUserService as any);
  });

  test('updateUser returns success message on success', async () => {
    const req: any = { user: { user_id: 'u1' } };
    mockUserService.updateUser.mockResolvedValue(undefined);

    const res = await controller.updateUser(req, { lastUsedLanguageId: 2 } as any);
    expect(res).toEqual({ message: 'Success' });
    expect(mockUserService.updateUser).toHaveBeenCalledWith('u1', { lastUsedLanguageId: 2 });
  });

  test('updateUser rethrows HttpException', async () => {
    const req: any = { user: { user_id: 'u2' } };
    mockUserService.updateUser.mockRejectedValue(new BadRequestException('Bad request'));

    await expect(controller.updateUser(req, {} as any)).rejects.toBeInstanceOf(HttpException);
  });

  test('signInUser throws BadRequestException when email missing', async () => {
    const req: any = { user: { user_id: 'u3', email: undefined, name: 'n' } };
    await expect(controller.signInUser(req)).rejects.toBeInstanceOf(BadRequestException);
  });

  test('signInUser returns user data when service succeeds', async () => {
    const req: any = { user: { user_id: 'u4', email: 'a@a', name: 'n', picture: 'p' } };
    mockUserService.signInUser.mockResolvedValue({ pictureUrl: 'buf', lastUsedLanguageId: 7 });

    const res = await controller.signInUser(req);
    expect(res).toEqual({ data: { userId: 'u4', email: 'a@a', name: 'n', pictureUrl: 'buf', lastUsedLanguageId: 7 } });
  });
});
