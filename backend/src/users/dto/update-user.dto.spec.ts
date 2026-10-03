import { validate } from 'class-validator';

import { UpdateUserDto } from './update-user.dto';

describe('UpdateUserDto', () => {
  it('should accept an empty DTO', async () => {
    const dto = new UpdateUserDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should accept a valid DTO', async () => {
    const dto = new UpdateUserDto();

    dto.email = 'new@clientflow.com';
    dto.password = 'NovaSenha123';
    dto.name = 'Updated User';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject an invalid email', async () => {
    const dto = new UpdateUserDto();

    dto.email = 'invalid-email';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
  });

  it('should reject a short password', async () => {
    const dto = new UpdateUserDto();

    dto.password = '1234567';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
  });

  it('should reject a short name', async () => {
    const dto = new UpdateUserDto();

    dto.name = 'A';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('name');
  });
});