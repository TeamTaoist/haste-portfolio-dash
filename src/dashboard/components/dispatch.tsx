import * as Form from '@radix-ui/react-form';

const FormDemo = () => (
  <Form.Root className="FormRoot">
    <Form.Field className="FormField" name="tokenhash">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Form.Label className="FormLabel">Token Script Hash</Form.Label>
        <Form.Message className="FormMessage" match="valueMissing">
          Please input the token hash
        </Form.Message>
      </div>
      <Form.Control asChild>
        <input className="Input" type="tokenhash" required />
      </Form.Control>
    </Form.Field>
    <Form.Field className="FormField" name="addresslist">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Form.Label className="FormLabel">Dispache to below accounts</Form.Label>
        <Form.Message className="FormMessage" match="valueMissing">
          Please enter a question
        </Form.Message>
      </div>
      <Form.Control asChild>
        <textarea className="Textarea" required />
      </Form.Control>
    </Form.Field>
    <Form.Submit asChild>
      <button className="Button" style={{ marginTop: 10 }}>
        Post question
      </button>
    </Form.Submit>
  </Form.Root>
);

export default FormDemo;