import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { config } from '../config/config';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../user/entities/user.entity';

function cookieExtractor(req: any): null | string {
  return req && req.cookies ? req.cookies?.access_token ?? null : null;
}

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: cookieExtractor,
      secretOrKey: config.jwtSecret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any, done: (error, user) => void) {
    if (!payload?.jwtId) return done(new UnauthorizedException(), false);

    const user = await User.findOne({
      where: { jwtId: payload.jwtId },
    });

    if (!user) return done(new UnauthorizedException(), false);

    done(null, user);
  }
}
