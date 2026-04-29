/**
 * Tests for SaveStatusIndicator component
 */

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import SaveStatusIndicator from './SaveStatusIndicator';

describe('SaveStatusIndicator', () => {
  it('should not render when status is idle', () => {
    const element = createElement(SaveStatusIndicator, { status: 'idle' });
    expect(element.props.status).toBe('idle');
  });

  it('should accept saving status', () => {
    const element = createElement(SaveStatusIndicator, { status: 'saving' });
    expect(element.props.status).toBe('saving');
  });

  it('should accept saved status', () => {
    const element = createElement(SaveStatusIndicator, { status: 'saved' });
    expect(element.props.status).toBe('saved');
  });

  it('should accept offline status', () => {
    const element = createElement(SaveStatusIndicator, { status: 'offline' });
    expect(element.props.status).toBe('offline');
  });

  it('should accept error status', () => {
    const element = createElement(SaveStatusIndicator, { status: 'error' });
    expect(element.props.status).toBe('error');
  });

  it('should accept custom className', () => {
    const element = createElement(SaveStatusIndicator, { 
      status: 'saved', 
      className: 'custom-class' 
    });
    expect(element.props.className).toBe('custom-class');
  });
});
