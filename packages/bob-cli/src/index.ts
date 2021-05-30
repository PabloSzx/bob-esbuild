import { run } from '@oclif/command';
import flush from '@oclif/command/flush';
import handle from '@oclif/errors/handle';

run().then(flush, handle);
