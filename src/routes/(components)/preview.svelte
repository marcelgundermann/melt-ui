<script lang="ts" context="module">
	export type PreviewProps = {
		component: any;
		code: {
			Tailwind: {
				[key: string]: string;
				'index.svelte': string;
				'tailwind.config.ts': string;
			};
			CSS: {
				[key: string]: string;
				'index.svelte': string;
				'globals.css': string;
			} | null;
		};
		fullwidth?: boolean;
	};
</script>

<script lang="ts">
	import { createSelect, type CreateSelectArgs } from '$lib';
	import { cn } from '$routes/helpers';
	import CodeBlock from './code-block.svelte';
	import PreviewWrapper from './preview-wrapper.svelte';
	import Select from './select.svelte';
	import Switch from './switch.svelte';
	import { TabsList, TabsRoot } from './tabs';

	type $$Props = PreviewProps;

	export let component: $$Props['component'];
	export let code: $$Props['code'];
	export let fullwidth: $$Props['fullwidth'] = false;

	let codingStyle = Object.keys(code)[0] ? ('Tailwind' as const) : ('CSS' as const);
	let codingStyleObj: $$Props['code'][typeof codingStyle] | null = code[codingStyle];

	$: {
		codingStyleObj = code[codingStyle];
	}

	$: files = codingStyleObj !== null ? Object.keys(codingStyleObj) : [];

	const { value } = createSelect({
		value: codingStyle,
	});
	value.subscribe((v) => {
		if (v === 'Tailwind' || v === 'CSS') {
			codingStyle = v;
		}
	});

	let viewCode = false;

	$: codeOptions = Object.entries(code).map(([key, value]) => {
		return {
			value: key,
			label: key,
			disabled: value === null,
		} satisfies CreateSelectArgs;
	});
</script>

<div class="mt-4 flex flex-row items-center justify-between">
	<div class="flex h-10 items-center lg:hidden">
		{#if viewCode}
			<Select options={codeOptions} bind:value={codingStyle} />
		{/if}
	</div>

	<div class="ml-auto">
		<Switch bind:checked={viewCode} />
	</div>
</div>

<div class="relative mt-2 rounded-md">
	{#if viewCode}
		<TabsRoot tabs={files} let:tab>
			<div class="flex h-10 flex-col-reverse gap-4 lg:flex-row lg:items-center">
				<div class={cn(files.length === 1 && 'lg:hidden')}>
					<TabsList />
				</div>

				<div class="ml-auto hidden lg:block">
					<Select options={codeOptions} bind:value={codingStyle} />
				</div>
			</div>
			{#if codingStyleObj && codingStyleObj[tab]}
				<CodeBlock code={codingStyleObj[tab]} />
			{/if}
		</TabsRoot>
	{:else}
		<PreviewWrapper {fullwidth}>
			<svelte:component this={component} />
		</PreviewWrapper>
	{/if}
</div>
