const textareas = document.querySelectorAll('.dynamicTextarea');

textareas.forEach((textarea) => {
  adjustHeight(textarea);
  textarea.addEventListener('input', () => adjustHeight(textarea));
});

window.addEventListener('resize', () => {
  textareas.forEach((textarea) => adjustHeight(textarea));
});

function adjustHeight(textarea) {
    // Store the original scroll position
    const scrollTop = textarea.scrollTop;
  
    // Temporarily reset the textarea height for calculation
    textarea.style.height = 'auto';
    
    const lineHeight = 20;
    
    const rowsNeeded = Math.ceil(textarea.scrollHeight / lineHeight);
  
    // Debugging line: Remove or comment this out in production
    console.log(`Rows needed: ${rowsNeeded}`);
    
    // Set the textarea height based on the scrollHeight
    textarea.style.height = `${textarea.scrollHeight}px`;
  
    // Restore the original scroll position
    textarea.scrollTop = scrollTop;
}