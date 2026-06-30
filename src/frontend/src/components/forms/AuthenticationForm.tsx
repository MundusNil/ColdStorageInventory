import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { apiUrl } from '@lib/functions/Api';
import {
  Alert,
  Anchor,
  Button,
  Divider,
  Group,
  Loader,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  VisuallyHidden
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { api } from '../../App';
import {
  doBasicLogin,
  doSimpleLogin,
  ensureCsrf,
  followRedirect
} from '../../functions/auth';
import { showLoginNotification } from '../../functions/notifications';
import { useServerApiState } from '../../states/ServerApiState';
import { useUserState } from '../../states/UserState';
import { SsoButton } from '../buttons/SSOButton';
import { errorCodeLink } from '../nav/Alerts';

export function AuthenticationForm() {
  const classicForm = useForm({
    initialValues: { username: '', password: '', code: '' }
  });
  const simpleForm = useForm({ initialValues: { email: '' } });
  const [classicLoginMode, setMode] = useDisclosure(true);
  const [auth_config, sso_enabled, password_forgotten_enabled] =
    useServerApiState(
      useShallow((state) => [
        state.auth_config,
        state.sso_enabled,
        state.password_forgotten_enabled
      ])
    );
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useUserState();

  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  async function handleLogin() {
    setIsLoggingIn(true);

    if (classicLoginMode === true) {
      await ensureCsrf();
      doBasicLogin(
        classicForm.values.username,
        classicForm.values.password,

        navigate,
        classicForm.values.code
      )
        .then((success) => {
          setIsLoggingIn(false);

          if (isLoggedIn()) {
            showLoginNotification({
              title: '登录成功',
              message: '已成功登录'
            });
            followRedirect(navigate, location?.state);
          } else if (success) {
            // MFA login
          } else {
            showLoginNotification({
              title: '登录失败',
              message: '请检查账号和密码后重试。',
              success: false
            });
          }
        })
        .catch(() => {
          showNotification({
            title: '登录失败',
            message: '请检查账号和密码后重试。',
            color: 'red'
          });
        });
    } else {
      doSimpleLogin(simpleForm.values.email).then((ret) => {
        setIsLoggingIn(false);

        if (ret?.status === 'ok') {
          showLoginNotification({
            title: '登录邮件发送成功',
            message: '登录邮件已发送，请检查邮箱。'
          });
        } else {
          showLoginNotification({
            title: '登录邮件发送失败',
            message: '邮件发送失败，请检查邮箱地址后重试。',
            success: false
          });
        }
      });
    }
  }

  return (
    <>
      {sso_enabled() ? (
        <>
          <Group grow mb='md' mt='md'>
            {auth_config?.socialaccount.providers.map((provider) => (
              <SsoButton provider={provider} key={provider.id} />
            ))}
          </Group>

          <Divider
            label='也可以使用其他登录方式'
            labelPosition='center'
            my='lg'
          />
        </>
      ) : null}
      <form onSubmit={classicForm.onSubmit(handleLogin)}>
        {classicLoginMode ? (
          <Stack gap={0}>
            <TextInput
              required
              label='账号'
              aria-label='login-username'
              placeholder='请输入账号'
              {...classicForm.getInputProps('username')}
            />
            <PasswordInput
              required
              label='密码'
              aria-label='login-password'
              placeholder='请输入密码'
              {...classicForm.getInputProps('password')}
            />
            <VisuallyHidden>
              <TextInput
                name='TOTP'
                {...classicForm.getInputProps('code')}
                hidden={true}
              />
            </VisuallyHidden>
            {password_forgotten_enabled() === true && (
              <Group justify='space-between' mt='0'>
                <Anchor
                  component='button'
                  type='button'
                  c='dimmed'
                  size='xs'
                  onClick={() => navigate('/reset-password')}
                >
                  忘记密码
                </Anchor>
              </Group>
            )}
          </Stack>
        ) : (
          <Stack>
            <TextInput
              required
              label='邮箱'
              description='如果账号已注册，系统会发送登录链接到邮箱。'
              placeholder='email@example.org'
              {...simpleForm.getInputProps('email')}
            />
          </Stack>
        )}

        <Group justify='space-between' mt='xl'>
          <Anchor
            component='button'
            type='button'
            c='dimmed'
            size='xs'
            onClick={() => setMode.toggle()}
          >
              {classicLoginMode ? '发送邮箱登录链接' : '使用账号密码登录'}
          </Anchor>
          <Button type='submit' disabled={isLoggingIn}>
            {isLoggingIn ? (
              <Loader size='sm' />
            ) : (
              <>
                {classicLoginMode ? '登录' : '发送邮件'}
              </>
            )}
          </Button>
        </Group>
      </form>
    </>
  );
}

export function RegistrationForm() {
  const registrationForm = useForm({
    initialValues: {
      username: '',
      email: '',
      password: '',
      password2: '' as string | undefined
    }
  });
  const navigate = useNavigate();
  const [auth_config, registration_enabled, sso_registration] =
    useServerApiState(
      useShallow((state) => [
        state.auth_config,
        state.registration_enabled,
        state.sso_registration_enabled
      ])
    );
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  async function handleRegistration() {
    // 检查两次密码是否一致
    if (
      registrationForm.values.password !== registrationForm.values.password2
    ) {
      registrationForm.setFieldError('password2', '两次输入的密码不一致');
      return;
    }
    setIsRegistering(true);

    // 后端只需要一份密码，重复密码不随请求发送
    const { password2, ...vals } = registrationForm.values;
    await ensureCsrf();

    api
      .post(apiUrl(ApiEndpoints.auth_signup), vals, {
        headers: { Authorization: '' }
      })
      .then((ret) => {
        if (ret?.status === 200) {
          setIsRegistering(false);
          showLoginNotification({
            title: '注册成功',
            message: '请到邮箱中确认账号，完成注册。'
          });
          navigate('/home');
        }
      })
      .catch((err) => {
        if (err.response?.status === 400) {
          setIsRegistering(false);

          // 按字段收集后端返回的错误
          const errors: { [key: string]: string[] } = {};
          for (const val of err.response.data.errors) {
            if (!errors[val.param]) {
              errors[val.param] = [];
            }
            errors[val.param].push(val.message);
          }

          for (const key in errors) {
            registrationForm.setFieldError(key, errors[key]);
          }

          showLoginNotification({
            title: '输入有误',
            message: '请检查填写内容后重试。',
            success: false
          });
        }
      });
  }

  const both_reg_enabled = registration_enabled() && sso_registration();
  return (
    <>
      {registration_enabled() && (
        <form onSubmit={registrationForm.onSubmit(() => {})}>
          <Stack gap={0}>
            <TextInput
              required
              label='账号'
              aria-label='register-username'
              placeholder='请输入账号'
              {...registrationForm.getInputProps('username')}
            />
            <TextInput
              required
              label='邮箱'
              aria-label='register-email'
              description='用于接收确认邮件'
              placeholder='email@example.org'
              {...registrationForm.getInputProps('email')}
            />
            <PasswordInput
              required
              label='密码'
              aria-label='register-password'
              placeholder='请输入密码'
              {...registrationForm.getInputProps('password')}
            />
            <PasswordInput
              required
              label='重复密码'
              aria-label='register-password-repeat'
              placeholder='请再次输入密码'
              {...registrationForm.getInputProps('password2')}
            />
          </Stack>

          <Group justify='space-between' mt='xl'>
            <Button
              type='submit'
              disabled={isRegistering}
              onClick={handleRegistration}
              fullWidth
            >
              注册
            </Button>
          </Group>
        </form>
      )}
      {both_reg_enabled && (
        <Divider label='或使用单点登录' labelPosition='center' my='lg' />
      )}
      {sso_registration() && (
        <Group grow mb='md' mt='md'>
          {auth_config?.socialaccount.providers.map((provider) => (
            <SsoButton provider={provider} key={provider.id} />
          ))}
        </Group>
      )}
      {!registration_enabled() && !sso_registration() && (
        <Alert title='注册未启用' color='orange'>
          <Text>可能是邮件设置未配置，也可能是管理员主动关闭了注册。</Text>
          {errorCodeLink('INVE-W11')}
        </Alert>
      )}
    </>
  );
}
