<script lang="ts">
    export let type: "text" | "number" | "checkbox" | "textArea" = "text";
    export let width: number;
    export let height: number;
    export let x: number;
    export let y: number;
    export let value: string | number = "";
    export let checked: boolean = false;
    export let fontSize: number = 10;
    export let signNumber: boolean = false;
    export let centerText: boolean = false;
</script>
{#if signNumber && type === "number" && typeof value === "number" && value > 0}
<p style="position: absolute; top: {y/10.0}cqh; left: {(x - (width * 0.2))/10.0}cqh; width: {width/10.0}cqh; height: {height/10.0}cqh; font-size: {fontSize / 10.0}cqh; line-height: {height / 10.0}cqh; display: flex; align-items: center; justify-content: center;">+</p>
{/if}
{#if type === "checkbox"}
<input type="checkbox" class="input" bind:checked={checked} style="position: absolute; top: {y/10.0}cqh; left: {x/10.0}cqh; width: {width/10.0}cqh; height: {height/10.0}cqh;" />
{:else if type === "textArea"}
<textarea class="input" bind:value={value} style="position: absolute; top: {y/10.0}cqh; left: {x/10.0}cqh; width: {width/10.0}cqh; height: {height/10.0}cqh; font-size: {fontSize / 10.0}cqh; line-height: {fontSize / 10.0}cqh;" />
{:else}
<input type={type} class="input {centerText ? 'text-center' : ''}" bind:value={value} style="position: absolute; top: {y/10.0}cqh; left: {(signNumber && type === "number" && typeof value === "number" && value > 0 ? (x + (width * 0.1)) : x)/10.0}cqh; width: {width/10.0}cqh; height: {height/10.0}cqh; font-size: {fontSize / 10.0}cqh; line-height: {height / 10.0}cqh;" />
{/if}
<style>
    /* Chrome, Safari, Edge, Opera */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    textarea {
        background-color: #ffffff00;
        border: none;
        padding: 0%;
        margin: 0%;
        resize: none;
    }

    input {
        background-color: #ffffff00;
        border: none;
        padding: 0%;
        margin: 0%;
    }

    .input[type="checkbox"]:checked {
        background-color: #000;
        border-color: #000;
    }

    /* Firefox */
    input[type=number] {
        -moz-appearance: textfield;
        text-align: center;
    }
</style>