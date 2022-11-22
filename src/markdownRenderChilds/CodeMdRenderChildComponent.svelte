<script lang="ts">
	import {CodeMdRenderChildData, LogLevel} from './AbstractCodeMdRenderChild';
	import {Button, SettingItem, TextInput} from 'obsidian-svelte';
	import {getPlaceholderUUID} from '../utils/Utils';

	export let data: CodeMdRenderChildData;
	export let idCommentPlaceholder: string;
	export let sendToStdin: (data: string) => Promise<void>;
	export let run: () => Promise<void>;

	export function update() {
		data = data;
	}

	export function updateConsole() {
		data.console = data.console;
	}

	function runCode() {
		run();
		data = data;
	}

	function getClassForLogLevel(level: LogLevel) {
		let logLevelMap: Record<LogLevel, string> = {
			[LogLevel.TRACE]: 'script-runner-trace-console',
			[LogLevel.INFO]: '',
			[LogLevel.WARN]: 'script-runner-warn-console',
			[LogLevel.ERROR]: 'script-runner-error-console',
		};

		return logLevelMap[level] ?? '';
	}

	function getCodeBlockLang() {
		return `language-${data.language}`;
	}
</script>

<div class="card" style="background: var(--background-secondary)">
	<h3>Script Runner</h3>
	<div>
		<pre class={getCodeBlockLang()} tabindex=0><code class={getCodeBlockLang()}>{data.content}</code></pre>
	</div>
	{#if data.id }
		<div class="script-runner-settings-group">
			<SettingItem
				name="Run"
				description="Run your script">
				<Button on:click={runCode}>{data.running ? 'Running...' : 'Run'}</Button>
			</SettingItem>
			<div class="script-runner-row-flex">
				<TextInput class="script-runner-expand" bind:value={data.input}></TextInput>
				<Button on:click={sendToStdin(data.input)}>Input</Button>
			</div>
			<div>
				<pre class="language-console"><code>{#each data.console as logEntry}<span
					class={getClassForLogLevel(logEntry.level)}>{logEntry.message}</span>{/each}</code></pre>
			</div>
		</div>
	{:else}
		<div class="script-runner-settings-group">
			<h4>Missing Id</h4>
			<p>
				The code block is missing an id or the id comment is incorrect.
			</p>
			<p><b>Reason</b></p>
			<code class="script-runner-error-ui">{data.idError}</code>
			<p>
				The id comment should look like
			</p>
			<code>{idCommentPlaceholder}</code>
			<p>
				and be the first line in the code block.
			</p>
			<p>
				Where <code>{getPlaceholderUUID()}</code> is a unique id for this code block.
				You can generate UUIDs with the <code>Generate UUID</code> command.
			</p>
		</div>
	{/if}

</div>
