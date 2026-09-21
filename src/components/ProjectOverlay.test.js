import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ProjectOverlay from './ProjectOverlay.vue';

describe('ProjectOverlay keyboard behavior', () => {
  it('closes when Escape is pressed', async () => {
    const wrapper = mount(ProjectOverlay, {
      attachTo: document.body,
      props: { view: 'about' }
    });

    await wrapper.trigger('keydown', { key: 'Escape' });

    expect(wrapper.emitted('close')).toHaveLength(1);
    wrapper.unmount();
  });

  it('wraps keyboard focus within the dialog', async () => {
    const wrapper = mount(ProjectOverlay, {
      attachTo: document.body,
      props: { view: 'about' }
    });
    const buttons = wrapper.findAll('button');
    const firstButton = buttons[0].element;
    const lastButton = buttons.at(-1).element;

    lastButton.focus();
    await wrapper.trigger('keydown', { key: 'Tab' });
    expect(document.activeElement).toBe(firstButton);

    firstButton.focus();
    await wrapper.trigger('keydown', { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastButton);
    wrapper.unmount();
  });
});
