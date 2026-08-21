import React from 'react';
import { IconSettings } from '../icons';
export function SettingsTab(){return <div className="ce-settings"><div className="ce-settings-icon"><IconSettings/></div><h2>Extraction settings</h2><p>Selector overrides, Element Inspector, and scroll timing live in the extension's Options page so they stay in one place.</p><button onClick={()=>chrome.runtime.openOptionsPage()}>Open Options</button></div>}
