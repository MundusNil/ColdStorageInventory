import { Anchor, Divider, Text } from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useShallow } from 'zustand/react/shallow';
import { removeTraceId, setApiDefaults, setTraceId } from '../../App';
import { AuthFormOptions } from '../../components/forms/AuthFormOptions';
import { AuthenticationForm } from '../../components/forms/AuthenticationForm';
import { InstanceOptions } from '../../components/forms/InstanceOptions';
import {
  defaultHostKey,
  translateHostName
} from '../../defaults/defaultHostList';
import {
  checkLoginState
} from '../../functions/auth';
import { useLocalState } from '../../states/LocalState';
import { useServerApiState } from '../../states/ServerApiState';
import { Wrapper } from './Layout';

function removeSensitiveLoginParams() {
  const params = new URLSearchParams(window.location.search);
  const sensitiveParams = ['login', 'password'];
  let changed = false;

  sensitiveParams.forEach((param) => {
    if (params.has(param)) {
      params.delete(param);
      changed = true;
    }
  });

  if (!changed) {
    return;
  }

  const queryString = params.toString();
  const cleanUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}${window.location.hash}`;
  window.history.replaceState(window.history.state, document.title, cleanUrl);
}

export default function Login() {
  const [hostKey, setHost, hostList] = useLocalState(
    useShallow((state) => [state.hostKey, state.setHost, state.hostList])
  );
  const [server, fetchServerApiState] = useServerApiState(
    useShallow((state) => [state.server, state.fetchServerApiState])
  );
  const hostname =
    hostList[hostKey] === undefined
      ? '未选择服务器'
      : translateHostName(hostList[hostKey]?.name);
  const [hostEdit, setHostEdit] = useToggle([false, true] as const);
  const navigate = useNavigate();
  const location = useLocation();
  const [sso_registration, registration_enabled] = useServerApiState(
    useShallow((state) => [
      state.sso_registration_enabled,
      state.registration_enabled
    ])
  );
  const any_reg_enabled = registration_enabled() || sso_registration() || false;

  const LoginMessage = useMemo(() => {
    const val = server.customize?.login_message;
    if (val == undefined) return null;
    return (
      <>
        <Divider my='md' />
        <Text>
          <span
            // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
            dangerouslySetInnerHTML={{ __html: val }}
          />
        </Text>
      </>
    );
  }, [server.customize]);

  // Data manipulation functions
  function ChangeHost(newHost: string | null): void {
    if (newHost === null) return;
    setHost(hostList[newHost]?.host, newHost);
    setApiDefaults();
    const traceid = setTraceId();
    fetchServerApiState();
    removeTraceId(traceid);
  }

  // Set default host to localhost if no host is selected
  useEffect(() => {
    removeSensitiveLoginParams();

    if (hostKey === '') {
      ChangeHost(defaultHostKey);
    }

    checkLoginState(navigate, location?.state, true);
  }, []);

  return (
    <>
      {hostEdit ? (
        <InstanceOptions
          hostKey={hostKey}
          ChangeHost={ChangeHost}
          setHostEdit={setHostEdit}
        />
      ) : (
        <>
          <Wrapper titleText='登录冷库系统' smallPadding>
            <AuthenticationForm />
            {any_reg_enabled && (
              <Text ta='center' size={'xs'} mt={'md'}>
                还没有账号？{' '}
                <Anchor
                  component='button'
                  type='button'
                  c='dimmed'
                  size='xs'
                  onClick={() => navigate('/register')}
                >
                  注册
                </Anchor>
              </Text>
            )}
            {LoginMessage}{' '}
          </Wrapper>
          <AuthFormOptions hostname={hostname} toggleHostEdit={setHostEdit} />
        </>
      )}
    </>
  );
}
