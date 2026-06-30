import { Button, PasswordInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { handlePasswordReset } from '../../functions/auth';
import { Wrapper } from './Layout';

export default function ResetPassword() {
  const simpleForm = useForm({ initialValues: { password: '' } });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const key = searchParams.get('key');

  // make sure we have a key
  useEffect(() => {
    if (!key) {
      notifications.show({
        title: '重置链接无效',
        message: '需要有效的重置链接才能设置新密码，请检查邮箱中的重置邮件。',
        color: 'red',
        autoClose: false
      });
    }
  }, [key]);

  return (
    <Wrapper titleText='设置新密码'>
      <PasswordInput
        required
        label='新密码'
        description='请输入要设置的新密码'
        {...simpleForm.getInputProps('password')}
      />
      <Button
        type='submit'
        onClick={() =>
          handlePasswordReset(key, simpleForm.values.password, navigate)
        }
      >
        保存新密码
      </Button>
    </Wrapper>
  );
}
