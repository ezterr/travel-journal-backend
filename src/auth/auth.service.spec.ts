import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { User } from '../models/user/entities/user.entity';
import { UserService } from '../models/user/user.service';
import { config } from '../config';
import { JwtService } from '@nestjs/jwt';
const moduleMocker = new ModuleMocker(global);

const userById = (id: string, userObj?: Partial<User>): User => {
  const user = new User();
  user.id = userObj?.id ?? id;
  user.firstName = userObj?.firstName ?? 'Jan';
  user.lastName = userObj?.lastName ?? 'Kowalski';
  user.username = userObj?.username ?? 'janko';
  user.email = userObj?.email ?? 'jan@xyz.pl';
  user.bio = userObj?.bio ?? '';
  user.hashPwd = '$2a$13$bh3Xmv3pYKrMmGYdvpy3oeEuqg4/CIq4NVfBq/bMTMRTIinSrLG7u';
  user.jwtId = userObj?.jwtId ?? '123';
  user.photoFn = userObj?.id ?? null;

  return user;
};

const userByIdFiltering = (id: string, userObj?: Partial<User>) => {
  const { jwtId, hashPwd, photoFn, ...userResponse } = userById(id, userObj);

  return { ...userResponse, avatar: `/api/user/photo/${userResponse.id}` };
};

describe('AuthService', () => {
  let service: AuthService;
  let responseMock: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    })
      .useMocker((token) => {
        if (token === UserService) {
          return {
            filter: jest.fn((user: User) => {
              const { jwtId, hashPwd, photoFn, ...userResponse } = user;

              return {
                ...userResponse,
                avatar: `/api/user/photo/${userResponse.id}`,
              };
            }),
            checkUserFieldUniqueness: jest.fn().mockResolvedValue([]),
          };
        }

        if (token === JwtService) {
          return {
            sign: jest.fn(() => '12345'),
          };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    responseMock = {
      cookie: jest.fn((key, value, options) => {
        responseMock.cookieKey = key;
        responseMock.cookieValue = value;
        responseMock.cookieOptions = options;
      }),

      clearCookie: jest.fn((key) => (responseMock.clearCookieKey = key)),
    };

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('validateUser should return null', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async () => null);

    const validateUserResult = await service.validateUser('abc', 'abc');
    expect(validateUserResult).toBe(null);
  });

  it('validateUser should return user', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async () => userById('123'));

    const validateUserResult = await service.validateUser('abc', 'abc');
    expect(validateUserResult).toEqual(userById('123'));
  });

  it('login should return user without sensitive data', async () => {
    jest
      .spyOn(User.prototype, 'save')
      .mockImplementation(async () => userById('123'));
    const user = userById('123');
    const loginUser = await service.login(user, responseMock);

    expect(loginUser).toEqual(userByIdFiltering('123'));
  });

  it('login should set secure cookie', async () => {
    jest.spyOn(User, 'save').mockImplementation(async () => userById('123'));

    const user = userById('123');
    await service.login(user, responseMock);

    expect(user.jwtId).toBeDefined();
    expect(responseMock.cookieKey).toBe('access_token');
    expect(responseMock.cookieValue).toBeDefined();
    expect(responseMock.cookieOptions.secure).toBe(false);
    expect(responseMock.cookieOptions.httpOnly).toBe(true);
    expect(responseMock.cookieOptions.maxAge).toBe(
      config.jwtCookieTimeToExpire,
    );
    expect(responseMock.cookieOptions.domain).toBe(config.jwtCookieDomain);
  });

  it('logout should clearCookie', async () => {
    await service.logout(responseMock);

    expect(responseMock.clearCookieKey).toBe('access_token');
  });

  it('logoutAll should set in args user with jwtId', async () => {
    expect(await service.logoutAll(new User(), responseMock)).toEqual({
      ok: false,
    });
  });

  it('logoutAll should clearCookie', async () => {
    const user = new User();
    user.jwtId = '123';

    await service.logoutAll(user, responseMock);

    expect(responseMock.clearCookieKey).toBe('access_token');
  });

  it('logoutAll should return {ok: true} if success', async () => {
    const user = new User();
    user.jwtId = '123';

    expect(await service.logoutAll(user, responseMock)).toEqual({
      ok: true,
    });
  });

  it('generateNewJwtId should return new jwt id', async () => {
    const newJwtId = await service.generateNewJwtId();
    expect(newJwtId).toBeDefined();
  });
});
