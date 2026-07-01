import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { handleVerifyEmail } from '../../functions/auth';
import { Wrapper } from './Layout';

export default function VerifyEmail() {
  const { key } = useParams();
  const navigate = useNavigate();

  // make sure we have a key
  useEffect(() => {
    if (!key) {
      notifications.show({
        title: '验证链接无效',
        message: '需要有效的邮箱验证链接。',
        color: 'red'
      });
      navigate('/login');
    }
  }, [key]);

  return (
    <Wrapper titleText='验证邮箱'>
      <Button type='submit' onClick={() => handleVerifyEmail(key, navigate)}>
        验证
      </Button>
    </Wrapper>
  );
}
