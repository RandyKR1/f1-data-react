import Dropdown from 'react-bootstrap/Dropdown';

const DropdownSelector = ({ title, options, selected, onSelect, className="" }) => (
    <Dropdown>
    <Dropdown.Toggle 
      variant="light" 
      className="w-100 text-cneter text-light bg-secondary">
      {selected || title}
    </Dropdown.Toggle>

    <Dropdown.Menu style={{ maxHeight: "200px", overflowY: "auto", width: "100%" }}>
      {options.map((opt) => {
        const label = typeof opt === 'string' ? opt : opt.label;
        const value = typeof opt === 'string' ? opt : opt.value;
        return (
          <Dropdown.Item 
            key={value} 
            onClick={() => onSelect(value)}
            className="text-center"
            >
            {label}
          </Dropdown.Item>
        );
      })}
    </Dropdown.Menu>
    </Dropdown>
);

export default DropdownSelector;
