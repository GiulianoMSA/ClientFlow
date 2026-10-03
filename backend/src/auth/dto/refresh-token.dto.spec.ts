import { validate } from 'class-validator';

import { RefreshTokenDto } from './refresh-token.dto';

describe('RefreshTokenDto', () => {
  it('should accept a valid refresh token', async () => {
    const dto = new RefreshTokenDto();

    dto.refreshToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-token';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject a token shorter than 32 characters', async () => {
    const dto = new RefreshTokenDto();

    dto.refreshToken = 'short-token';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('refreshToken');
  });

  it('should reject an empty DTO', async () => {
    const dto = new RefreshTokenDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('refreshToken');
  });
});