<!--adapted from @joethei's code: https://github.com/joethei/obsidian-rss/blob/master/src/view/IconComponent.svelte-->
<!--adapted from @javalent's code: https://discord.com/channels/686053708261228577/840286264964022302/902949764209987654-->
<script lang="ts">
	import {setIcon} from 'obsidian';

	export let iconName: string = '';

	function icon(node: HTMLElement, icon: string) {
		setIcon(node, icon);
	}
</script>

<style>
	.icon {
		line-height: 1em;
	}
</style>

{#if iconName.length > 0}
	<span use:icon={iconName} class="icon"></span>
{/if}
