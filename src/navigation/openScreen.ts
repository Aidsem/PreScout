const TAB_SCREENS = new Set(['CommandTab', 'LiveMap', 'MissionsTab', 'AssetsTab', 'HistoryTab']);

export function openScreen(navigation: any, name: string, params?: object) {
  let nav = navigation;
  while (nav) {
    const names: string[] | undefined = nav.getState?.()?.routeNames;
    if (names?.includes(name)) {
      nav.navigate(name, params);
      return;
    }
    nav = nav.getParent?.();
  }

  if (TAB_SCREENS.has(name)) {
    let stack = navigation;
    while (stack) {
      const names: string[] | undefined = stack.getState?.()?.routeNames;
      if (names?.includes('MainTabs')) {
        stack.navigate('MainTabs', { screen: name, params });
        return;
      }
      stack = stack.getParent?.();
    }
  }

  navigation.navigate(name, params);
}
