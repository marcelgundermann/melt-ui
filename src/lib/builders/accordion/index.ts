import {
	addEventListener,
	executeCallbacks,
	generateId,
	getElementByMeltId,
	kbd,
} from '$lib/internal/helpers';
import type { Defaults } from '$lib/internal/types';
import { derived, get, writable } from 'svelte/store';

type BaseAccordionArgs = {
	disabled?: boolean;
};

type SingleAccordionArgs = {
	value?: string;
	type?: 'single';
};

type MultipleAccordionArgs = {
	value?: string[];
	type: 'multiple';
};

export type CreateAccordionArgs = BaseAccordionArgs & (SingleAccordionArgs | MultipleAccordionArgs);

const defaults = {
	type: 'single',
} satisfies Defaults<CreateAccordionArgs>;

export const createAccordion = (args?: CreateAccordionArgs) => {
	const withDefaults = { ...defaults, ...args } as CreateAccordionArgs;
	const options = writable({
		disabled: withDefaults.disabled,
		type: withDefaults.type,
	});

	const value = writable<string | string[] | undefined>(withDefaults.value);

	const isSelected = (key: string, v: string | string[] | undefined) => {
		if (v === undefined) return false;
		if (typeof v === 'string') return v === key;
		return v.includes(key);
	};

	const isSelectedStore = derived(value, ($value) => {
		return (key: string) => isSelected(key, $value);
	});

	const root = {
		'data-melt-id': generateId(),
	};

	type ItemArgs =
		| {
				value: string;
				disabled?: boolean;
		  }
		| string;

	const parseItemArgs = (args: ItemArgs) => {
		if (typeof args === 'string') {
			return { value: args };
		} else {
			return args;
		}
	};

	const item = derived(value, ($value) => {
		return (args: ItemArgs) => {
			const { value: itemValue, disabled } = parseItemArgs(args);

			return {
				'data-state': isSelected(itemValue, $value) ? 'open' : 'closed',
				'data-disabled': disabled ? true : undefined,
			};
		};
	});

	const trigger = {
		...derived([value, options], ([$value, $options]) => {
			return (args: ItemArgs) => {
				const { value: itemValue, disabled } = parseItemArgs(args);

				return {
					'data-melt-part': 'trigger',
					'aria-expanded': isSelected(itemValue, $value) ? true : false,
					disabled: $options.disabled || disabled,
					'data-disabled': disabled ? true : undefined,
					'data-value': itemValue,
					// TODO: aria-controls, aria-labelledby
				};
			};
		}),
		action: (node: HTMLElement) => {
			const unsub = executeCallbacks(
				addEventListener(node, 'click', () => {
					const $options = get(options);
					const disabled = node.dataset.disabled === 'true';
					const itemValue = node.dataset.value;
					if (disabled || !itemValue) return;

					value.update(($value) => {
						if ($options.type === 'single') {
							return $value === itemValue ? undefined : itemValue;
						} else {
							const arrValue = $value as string[] | undefined;
							if (arrValue === undefined) {
								return [itemValue];
							} else {
								return arrValue.includes(itemValue)
									? arrValue.filter((v) => v !== itemValue)
									: [...arrValue, itemValue];
							}
						}
					});
				}),
				addEventListener(node, 'keydown', (e) => {
					if (![kbd.ARROW_DOWN, kbd.ARROW_UP, kbd.HOME, kbd.END].includes(e.key)) {
						return;
					}
					e.preventDefault();

					const el = e.target as HTMLElement;
					const rootEl = getElementByMeltId(root['data-melt-id']);

					if (!rootEl) return;
					const items = Array.from(
						rootEl.querySelectorAll('[data-melt-part="trigger"]')
					) as HTMLElement[];

					if (!items.length) return;
					const elIdx = items.indexOf(el);

					if (e.key === kbd.ARROW_DOWN) {
						items[(elIdx + 1) % items.length].focus();
					}
					if (e.key === kbd.ARROW_UP) {
						items[(elIdx - 1 + items.length) % items.length].focus();
					}
					if (e.key === kbd.HOME) {
						items[0].focus();
					}
					if (e.key === kbd.END) {
						items[items.length - 1].focus();
					}
				})
			);

			return {
				destroy: unsub,
			};
		},
	};

	const content = derived([value, options], ([$value, $options]) => {
		return (args: ItemArgs) => {
			const { value: itemValue } = parseItemArgs(args);
			const selected = isSelected(itemValue, $value);
			return {
				'data-state': selected ? 'open' : 'closed',
				'data-disabled': $options.disabled ? true : undefined,
				hidden: selected ? undefined : true,
			};
		};
	});

	return {
		root,
		value,
		item,
		trigger,
		content,
		isSelected: isSelectedStore,
		options,
	};
};
